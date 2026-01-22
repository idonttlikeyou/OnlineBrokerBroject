const chart = document.getElementById("chart");
const ctx = chart.getContext("2d");

let screenHeight = window.innerHeight;
let screenWidth = window.innerWidth;
let clicktimeoutId;
let isdragging = false;
let isholding = false;
let touchX = 0;
let touchY = 0;
let starttouchX = 0;
let starttouchY = 0;
let deltaX = 0;
let deltaY = 0;
let positionhitbox = Math.floor(screenHeight*0.02);

let isCrosshairEnabled = false;
let crosshairX = 0;
let crosshairY = 0;

let emblemtimeout;

let ok = new Audio("ok.wav");

chart.addEventListener("pointerdown", (e) => {
  chart.setPointerCapture(e.pointerId);
  deltaX = 0;
  deltaY = 0;
  touchX = e.clientX;
  touchY = e.clientY;
  //console.log("down");
  clickingEvent();
  clicktimeoutId = setTimeout(() => {
    isholding = true;
    holdingEvent();
  }, 100);
});

chart.addEventListener("pointermove", (e) => {
  clearTimeout(clicktimeoutId);
  /*console.log({
    move: true,
    deltaX,
    deltaY
  });*/
  deltaX = e.clientX - touchX;
  deltaY = e.clientY - touchY;
  touchX = e.clientX;
  touchY = e.clientY;
  isdragging = true;
  movingEvent();
  //console.log("move", e.clientX, e.clientY);
});

chart.addEventListener("pointerup", (e) => {
  clearTimeout(clicktimeoutId);
  if (!isholding && !isdragging) {
    onlyclicking = true;
    isholding = false;
    onlyClickingEvent();
  }
  isholding = false;
  isdragging = false;
  touchX = e.clientX;
  touchY = e.clientY;
  deltaX = 0;
  deltaY = 0;
  unclickEvent();
  //console.log("up");
  chart.releasePointerCapture(e.pointerId);
});

function holdingEvent() {
  if (starttouchX < pricebarleftposition && !ismovingbottombar && starttouchY < screenHeight-Ybottombar) isCrosshairEnabled = true;
  crosshairX = touchX;
  crosshairY = touchY;
}

function clickingEvent() {
  starttouchX = touchX;
  starttouchY = touchY;
  if (Math.abs(starttouchY-(screenHeight-Ybottombar)) <= positionhitbox && touchX < pricebarleftposition) {
    ismovingbottombar = true;
  } else if(starttouchY > screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*5+(unitedFontSize/4)*2) {
    ismovingpositionsdisplay = true;
  }
  iscurrentlymovingtp = false;
  iscurrentlymovingsl = false;
  if (Math.abs(touchY - getpositionfromprice(visiblehigh, visiblelow, temptp)) < positionhitbox) {
    iscurrentlymovingtp = true;
  } else if (Math.abs(touchY - getpositionfromprice(visiblehigh, visiblelow, tempsl)) < positionhitbox) {
    iscurrentlymovingsl = true;
  }
}

function movingEvent() {
  crosshairX += deltaX;
  crosshairY += deltaY;
  crosshairX = Math.min(pricebarleftposition, crosshairX);
  crosshairX = Math.max(0, crosshairX);
  crosshairY = Math.min(screenHeight-Ybottombar, crosshairY);
  crosshairY = Math.max(0, crosshairY);
  if (!isCrosshairEnabled && starttouchX <= pricebarleftposition && !ismovingbottombar && !iscurrentlymovingtp && !iscurrentlymovingsl && !ismovingpositionsdisplay) {
    Yoffset += deltaY;
    Xoffset += deltaX;
    if (Xoffset < candlewidth*-4) {
      Xoffset = candlewidth*-4;
    }
    if (Xoffset > candlewidth*(candles.length-totalcandlesinscreen-2)) Xoffset = candlewidth*(candles.length-totalcandlesinscreen-2);
  }
  if (starttouchX > pricebarleftposition) Ymargin += deltaY;
  if (Ymargin + Ybottombar > screenHeight*0.95) Ymargin = screenHeight*0.95 - Ybottombar;
  if (ismovingbottombar) {
    Ybottombar = screenHeight-touchY;
    Ybottombar = Math.min(Ybottombar, screenHeight/2);
    Ybottombar = Math.max(Ybottombar, unitedFontSize*4+screenHeight*0.02+(unitedFontSize/4)*2+unitedFontSize);
  }
  if(ismovingpositionsdisplay) {
    bottombarXoffset += deltaX;
    bottombarYoffset += deltaY;
    bottombarYoffset = Math.max(bottombarYoffset, ((unitedFontSize*positions.length + (unitedFontSize/4)*positions.length*2)-(screenHeight-(screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*5+(unitedFontSize/4)*2)))*-1);
    bottombarYoffset = Math.min(bottombarYoffset,0);
    bottombarXoffset = Math.min(bottombarXoffset, 0);
  }
  if (iscurrentlymovingtp) {
    temptp = getpricefromposition(visiblehigh, visiblelow, touchY);
  } else if (iscurrentlymovingsl) {
    tempsl = getpricefromposition(visiblehigh, visiblelow, touchY);
  }
}

function onlyClickingEvent() {
  isCrosshairEnabled = false;
  positionfound = false;
  for (const pos of positions) {
    if (Math.abs(touchY - getpositionfromprice(visiblehigh, visiblelow, pos.open)) < positionhitbox) {
      chosenpositionticket = pos.ticket;
      positionfound = true;
      chosenposition = pos;
      temptp = pos.tp;
      tempsl = pos.sl;
      break;
    }
  }
  if (!positionfound) {
    iscurrentlychoosingtp = false;
    iscurrentlychoosingsl = false;
    temptp = -1;
    tempsl = -1;
  }
}

function unclickEvent() {
  ismovingbottombar = false;
  ismovingpositionsdisplay = false
}

let isConnectedToServer = false;
let accountid;
let accountpassword;
let isAuth = false;

document.getElementById("accountid").value = localStorage.getItem("accountid");
document.getElementById("accountpassword").value = localStorage.getItem("accountpw");
accountid = document.getElementById("accountid").value;
accountpassword = document.getElementById("accountpassword").value;

document.getElementById("order_lot").value = 0.01;

let ws;
//const ip = "10.254.220.116";
//const ip = "192.168.0.109"; // permanent ig
const ip = "lafayette-sample-int-infringement.trycloudflare.com";
//const ip = "127.0.0.1";
//const port = 3000;
//const port = 4040;

// server connection watch
function connect() {
  alertemblem("Connecting to server...");
  //ws = new WebSocket(`ws://${ip}:${port}`);
  ws = new WebSocket(`wss://${ip}`);
  
  ws.onopen = () => {
    alertemblem("Connected to server!");
    console.log("CONNECTED");
    isConnectedToServer = true;
    if (accountpassword != null && accountid != null) {
      login();
    }
  };

  ws.onclose = () => {
    alertemblem("Disconnected from server :(");
    console.log("DISCONNECTED");
    isConnectedToServer = false;
    setTimeout(() => {
      connect();
    }, 3000);
  }

  ws.onerror = () => {
    alertemblem("Failed to reconnect.");
    ws.close();
  }

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === "priceupdate") {
      askIsGoingUp = data.askprice > currentaskprice ? true: false;
      bidIsGoingUp = data.currentprice > currentprice ? true: false;
      currentprice = data.currentprice;
      currentopen = data.currentopen;
      currentlow = data.currentlow;
      currenthigh = data.currenthigh;
      currentaskprice = data.askprice;
      nextcandleclosetimeleft = data.candletimeleft;
    } else if (data.type === "ping") {
      pingedEvent();
    } else if (data.type === "auth_response") {
      if (data.response === "auth_success") {
        authsuccess(data);
      } else {
        authfail();
      }
    } else if (data.type === "historicalpriceupdate") {
      candleIndex = data.candleidx;
      candles = data.data;
      switchcandlelasttime = data.timesincelastchange;
      nextcandleclose = data.nextcandleclose;
      timediffrence = Date.now() - data.timesincelastchange;
      // reset for a moment
      currentprice = currentprice;
      currentopen = currentprice;
      currentlow = currentprice;
      currenthigh = currentprice;
      currentaskprice = currentaskprice;
      //console.log(candles);
    } else if (data.type === "noticeUser") {
      alertemblem(data.message);
      playsound(data.sound);
    } else if (data.type === "accountUpdate") {
      balance = data.balance;
      margin = data.margin;
      equity = data.equity;
      freemargin = data.freemargin;
      floatingpl = data.floatingpl;
      positions = data.positions;
      leverage = data.leverage;
      for (const pos of positions) {
        if (Number(pos.ticket) === Number(chosenpositionticket)) {
          chosenposition = pos;
        }
      }
    }
  };
}
connect();

let candles = [];
let currentopen;
let currenthigh;
let currentlow;
let currentprice;

let nextcandleclosetimeleft;

let balance;
let margin;
let equity;
let freemargin;
let floatingpl;
let leverage;

let positions = [];

let chosenpositionticket;
let positionfound = false;
let chosenposition;

let currentaskprice;
let candleIndex;

let totalcandlesinscreen = 20;
let visiblehigh;
let visiblelow;
let candlewidth;

let Xoffset = 0;
let Yoffset = 0;
let Ymargin = 100;
let Ybottombar = Math.floor(screenHeight/5);
let ismovingbottombar = false;
let ismovingpositionsdisplay = false;
let bottombarXoffset = 0;
let bottombarYoffset = 0;

let tempsl = -1;
let temptp = -1;

let bidIsGoingUp = false;
let askIsGoingUp = false;

let iscurrentlychoosingsl = false;
let iscurrentlychoosingtp = false;
let iscurrentlymovingsl = false;
let iscurrentlymovingtp = false;

let pricebarleftposition = 0;

let isOrientationVertical;
let isCurrentlyInConfirmationScreen = false;
let ismodifyingorclosing = "";

let pingstart;
let pingend;
let pingtime;
let pingtimeoutid;
let pingid;

let unitedFontSize;

document.documentElement.requestFullscreen();
document.getElementById("changeorderconfirmation").style.display = "none";

function ping() {
  clearTimeout(pingtimeoutid);
  pingstart = performance.now();
  ws.send(JSON.stringify({
    type: "ping"
  }));
  clearTimeout(pingid);
  pingtimeoutid = setTimeout(() => {
    pingtime = 9999;
    alertemblem("Timed out.");
    ping();
  }, 10000);
}

function pingedEvent() {
  clearTimeout(pingtimeoutid);
  pingend = performance.now();
  pingtime = pingend - pingstart;
  pingid = setTimeout(() => {
    ping();
  }, 1000);
  let pingimg = document.getElementById("pingimg");
  if (pingtime < 200) {
    pingimg.src = "network_best.png";
  } else if (pingtime < 500) {
    pingimg.src = "network_good.png";
  } else if (pingtime < 1500) {
    pingimg.src = "network_ok.png";
  } else if (pingtime < 9998) {
    pingimg.src = "network_bad.png";
  } else {
    pingimg.src = "network_timeout.png";
  }
  if (!isConnectedToServer) {
    pingimg.src = "network_unavailable.png";
  }
}

function orderMenuTP() {
  const pos = chosenposition;
  const a = pos.side === "short"? -0.2: 0.2;
  if (pos.tp === -1 && temptp === -1) {
    temptp = pos.open + a;
    iscurrentlychoosingtp = true;
  } else {
    temptp = -1;
    iscurrentlychoosingtp = false;
  }
}

function orderMenuSL() {
  const pos = chosenposition;
  const a = pos.side === "short"? 0.2: -0.2;
  if (pos.sl === -1 && tempsl === -1) {
    tempsl = pos.open + a;
    iscurrentlychoosingsl = true;
  } else {
    tempsl = -1;
    iscurrentlychoosingsl = false;
  }
}

function orderMenuCancel() {
  positionfound = false;
  tempsl = -1;
  temptp = -1;
  iscurrentlychoosingtp = false;
  iscurrentlychoosingsl = false;
  temptp = -1;
  tempsl = -1;
}

function orderMenuClose() {
  isCurrentlyInConfirmationScreen = true;
  ismodifyingorclosing = "closing";
  if (chosenposition.tp !== -1) {
    document.getElementById("tpinput").value = chosenposition.tp;
  }
  if (chosenposition.sl !== -1) {
    document.getElementById("slinput").value = chosenposition.sl;
  }
}

function orderMenuConfirm() {
  isCurrentlyInConfirmationScreen = true;
  ismodifyingorclosing = "modifying";
  if (temptp !== -1) {
    document.getElementById("tpinput").value = Number(temptp.toFixed(2));
  }
  if (tempsl !== -1) {
    document.getElementById("slinput").value = Number(tempsl.toFixed(2));
  }
}

function modifyContinue() {
  const tp = Number(document.getElementById("tpinput").value) || -1;
  const sl = Number(document.getElementById("slinput").value) || -1;
  if (ismodifyingorclosing === "modifying") {
    ws.send(JSON.stringify({
      type: "modifyOrder",
      accid: accountid,
      accpw: accountpassword,
      ticket: chosenpositionticket,
      tp: tp,
      sl: sl
    }));
    isCurrentlyInConfirmationScreen = false;
    orderMenuCancel();
  } else {
    ws.send(JSON.stringify({
      type: "closeOrder",
      accid: accountid,
      accpw: accountpassword,
      ticket: chosenpositionticket
    }));
    isCurrentlyInConfirmationScreen = false;
    orderMenuCancel();
  }
}


function updateloop() {
  visiblehigh = currenthigh;
  visiblelow = currentlow;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, screenWidth, screenHeight);
  if (isAuth) {
    candlewidth = pricebarleftposition/totalcandlesinscreen;
    visiblelow = currentprice;
    let indexingstart = Math.max(0, candles.length - totalcandlesinscreen);
    for (let i = indexingstart; i < candles.length; i++) {
      visiblehigh = Math.max(visiblehigh, candles[i].high);
      visiblelow = Math.min(visiblelow, candles[i].low);
    }
    visiblehigh = Math.max(visiblehigh, currenthigh);
    visiblelow = Math.min(visiblelow, currentlow);

    let leftmostcandleposition = pricebarleftposition - candles.length*candlewidth;

    for (let i = 0; i < candles.length; i++) {
      let candle = candles[i];
      let candleopenpos = getpositionfromprice(visiblehigh, visiblelow, candle.open);
      let candlehighpos = getpositionfromprice(visiblehigh, visiblelow, candle.high);
      let candlelowpos = getpositionfromprice(visiblehigh, visiblelow, candle.low);
      let candleclosepos = getpositionfromprice(visiblehigh, visiblelow, candle.close);
      let candleheight = Math.abs(candleopenpos - candleclosepos);
      let wickheight = Math.abs(candlehighpos - candlelowpos);

      // historical candle
      if (candle.open > candle.close) {
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(leftmostcandleposition+((i-1)*candlewidth)+Xoffset, candleopenpos, candlewidth, candleheight);
      } else if (candle.open < candle.close) {
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(leftmostcandleposition+((i-1)*candlewidth)+Xoffset, candleclosepos, candlewidth, candleheight);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(leftmostcandleposition+((i-1)*candlewidth)+Xoffset, candleclosepos, candlewidth, 1);
      }

      if (candle.open > candle.close) {
        ctx.fillStyle = "#ff0000";
      } else if (candle.open < candle.close) {
        ctx.fillStyle = "#00ff00";
      } else {
        ctx.fillStyle = "#ffffff";
      }
      ctx.fillRect(leftmostcandleposition+((i-1)*candlewidth)+candlewidth/2+Xoffset, candlehighpos, 2, wickheight);
      //document.getElementById("debugtext").textContent = `vis.high: ${visiblehigh}\nvis.low: ${visiblelow}`;
    }
    let currentopenpos = getpositionfromprice(visiblehigh, visiblelow, currentopen);
    let currenthighpos = getpositionfromprice(visiblehigh, visiblelow, currenthigh);
    let currentlowpos = getpositionfromprice(visiblehigh, visiblelow, currentlow);
    let currentclosepos = getpositionfromprice(visiblehigh, visiblelow, currentprice);
    let currentheight = Math.abs(currentopenpos - currentclosepos);
    let currentwickheight = Math.abs(currenthighpos - currentlowpos);

    // current candle
    if (currentopen > currentprice) {
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(pricebarleftposition-candlewidth+Xoffset, currentopenpos, candlewidth, currentheight);
    } else if (currentopen < currentprice) {
      ctx.fillStyle = "#00ff00";
      ctx.fillRect(pricebarleftposition-candlewidth+Xoffset, currentclosepos, candlewidth, currentheight);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(pricebarleftposition-candlewidth+Xoffset, currentclosepos, candlewidth, 1);
    }

    if (currentopen > currentprice) {
      ctx.fillStyle = "#ff0000";
    } else if (currentopen < currentprice) {
      ctx.fillStyle = "#00ff00";
    } else {
      ctx.fillStyle = "#ffffff";
    }
    ctx.fillRect(pricebarleftposition-candlewidth+candlewidth/2+Xoffset, currenthighpos, 2, currentwickheight);

    // UI RENDER
    // Pricebar
    ctx.fillStyle = "#000000";
    ctx.fillRect(pricebarleftposition, 0, screenWidth-pricebarleftposition, screenHeight);
    ctx.beginPath();
    ctx.strokeStyle = "#888888";
    if (isOrientationVertical) {
      ctx.moveTo(pricebarleftposition, 0);
      ctx.lineTo(pricebarleftposition, screenHeight);
    } else {
      ctx.moveTo(pricebarleftposition, 0);
      ctx.lineTo(pricebarleftposition, screenHeight);
    }
    ctx.stroke();



    let priceLabelX = pricebarleftposition;
    let priceLabelY = currentclosepos-(screenWidth-pricebarleftposition)/8;
    let priceLabelW = screenWidth-pricebarleftposition;
    let priceLabelH = (screenWidth-pricebarleftposition)/4;
    unitedFontSize = Math.floor(priceLabelH-priceLabelH/3);
    let candlerange = visiblehigh-visiblelow;
    // price level(s)
    // if vertical divide into 12
    if (isOrientationVertical) {
      for (let i = 0; i < 11; i++) {
        let chartpricelabelquarters = `Rp.${getpricefromposition(visiblehigh, visiblelow, Math.floor(screenHeight/12 * (i+1))).toFixed(2)}`;
        ctx.font = `${unitedFontSize}px monospace`;
        let quarterw = ctx.measureText(chartpricelabelquarters).width;
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillText(chartpricelabelquarters, Math.floor(pricebarleftposition + priceLabelW/2 - quarterw/2), Math.floor(screenHeight/12 * (i+1)));
      }
    } else /*divide into 6 if horizontal*/ {
      for (let i = 0; i < 5; i++) {
        let chartpricelabelquarters = `Rp.${getpricefromposition(visiblehigh, visiblelow, Math.floor(screenHeight/6 * (i+1))).toFixed(2)}`;
        ctx.font = `${unitedFontSize}px monospace`;
        let quarterw = ctx.measureText(chartpricelabelquarters).width;
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillText(chartpricelabelquarters, Math.floor(pricebarleftposition + priceLabelW/2 - quarterw/2), Math.floor(screenHeight/6 * (i+1)));
      }
    }

    // bid
    ctx.fillStyle = "#ff1100";
    ctx.fillRect(priceLabelX, priceLabelY, Math.floor(priceLabelW), Math.floor(priceLabelH*2));

    let pricetext = `Rp.${Number(currentprice).toFixed(2)}`;
    ctx.font = `${unitedFontSize}px monospace`;
    let priceTextW = ctx.measureText(pricetext).width;
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(pricetext, pricebarleftposition + priceLabelW/2 - priceTextW/2, priceLabelY + priceLabelH/2);

    ctx.strokeStyle = "#ff1100";
    ctx.beginPath();
    ctx.moveTo(0, currentclosepos);
    ctx.lineTo(pricebarleftposition, currentclosepos);
    ctx.stroke();

    // time left until next candle
    let timetext = `${Math.max(Math.floor(nextcandleclosetimeleft/1000), 0)}s`;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(timetext, pricebarleftposition + priceLabelW/2 - priceTextW/2, priceLabelY + priceLabelH*1.5);

    //ask
    //console.log(currentaskprice);
    let askLabelY = getpositionfromprice(visiblehigh, visiblelow, currentaskprice)-(screenWidth-pricebarleftposition)/8;
    ctx.fillStyle = "#00ffaa";
    ctx.fillRect(priceLabelX, askLabelY, Math.floor(priceLabelW), Math.floor(priceLabelH));

    let askpricetext = `Rp.${Number(currentaskprice).toFixed(2)}`;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(askpricetext, pricebarleftposition + priceLabelW/2 - priceTextW/2, askLabelY + priceLabelH/2);

    ctx.strokeStyle = "#00ffaa";
    ctx.beginPath();
    ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, currentaskprice));
    ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, currentaskprice));
    ctx.stroke();
    for (const pos of positions) {
      if (positionfound && Number(pos.ticket) === Number(chosenpositionticket)) {
        ctx.strokeStyle = pos.side === "short"? "#ff0000": "#00ff00";
      } else if (positionfound) {
        ctx.strokeStyle = "#888888";
      } else {
        ctx.strokeStyle = pos.side === "short"? "#ff0000": "#00ff00";
      }

      ctx.beginPath();
      ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, pos.open));
      ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, pos.open));
      ctx.stroke();

      let postext = `${pos.side === "short" ? "SELL": "BUY"} ${pos.lot}, ${pos.floatingpl < 0 ? Number(pos.floatingpl).toFixed(2): `+${Number(pos.floatingpl).toFixed(2)}`}`;
      ctx.font = `${unitedFontSize}px monospace`;
      if (positionfound && Number(pos.ticket) === Number(chosenpositionticket)) {
        ctx.fillStyle = pos.side === "short"? "#ff0000": "#00ff00";
      } else if (positionfound) {
        ctx.fillStyle = "#888888";
      } else {
        ctx.fillStyle = pos.side === "short"? "#ff0000": "#00ff00";
      }
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.fillText(postext, 0, getpositionfromprice(visiblehigh, visiblelow, pos.open));

      if (pos.tp !== -1) {
        ctx.strokeStyle = "#00ff00";
        ctx.beginPath();
        ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, pos.tp));
        ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, pos.tp));
        ctx.stroke();
        ctx.font = `${unitedFontSize}px monospace`;
        if (positionfound) {
          ctx.fillStyle = "#888888";
        } else {
          ctx.fillStyle = "#00ff00";
        }
        ctx.textBaseline = "bottom";
        ctx.textAlign = "left";
        ctx.fillText("TP", 0, getpositionfromprice(visiblehigh, visiblelow, pos.tp));
      }
      if (pos.sl !== -1) {
        ctx.strokeStyle = "#ff0000";
        ctx.beginPath();
        ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, pos.sl));
        ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, pos.sl));
        ctx.stroke();
        ctx.font = `${unitedFontSize}px monospace`;
        if (positionfound) {
          ctx.fillStyle = "#888888";
        } else {
          ctx.fillStyle = "#ff0000";
        }
        ctx.textBaseline = "bottom";
        ctx.textAlign = "left";
        ctx.fillText("SL", 0, getpositionfromprice(visiblehigh, visiblelow, pos.sl));
      }
    }

    if (temptp !== -1) {
      ctx.strokeStyle = "#00ff00";
      ctx.beginPath();
      ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, temptp));
      ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, temptp));
      ctx.stroke();
      ctx.fillStyle = "#00ff00";
      const temptptxt = `TP, ${chosenposition.side === "long"? ((temptp - chosenposition.open)*leverage*chosenposition.lot*100).toFixed(2) : ((chosenposition.open - temptp)*leverage*chosenposition.lot*100).toFixed(2)}, ${Math.round(Math.abs(temptp - chosenposition.open) * 100)} pips`;
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.fillText(temptptxt, 0, getpositionfromprice(visiblehigh, visiblelow, temptp));
    }
    if (tempsl !== -1) {
      ctx.strokeStyle = "#ff0000";
      ctx.beginPath();
      ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, tempsl));
      ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, tempsl));
      ctx.stroke();
      ctx.fillStyle = "#ff0000";
      const tempsltxt = `SL, ${chosenposition.side === "long"? ((tempsl - chosenposition.open)*leverage*chosenposition.lot*100).toFixed(2) : ((chosenposition.open - tempsl)*leverage*chosenposition.lot*100).toFixed(2)}, ${Math.round(Math.abs(tempsl - chosenposition.open) * 100)} pips`;
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.fillText(tempsltxt, 0, getpositionfromprice(visiblehigh, visiblelow, tempsl));
    }

    //crosshair
    if (isCrosshairEnabled) {
      ctx.strokeStyle = "#ffffff"; // crosshaircolor
      ctx.beginPath();
      ctx.moveTo(0, crosshairY);
      ctx.lineTo(pricebarleftposition, crosshairY);
      ctx.stroke();

      ctx.strokeStyle = "#ffffff"; // crosshaircolor
      ctx.beginPath();
      ctx.moveTo(crosshairX, 0);
      ctx.lineTo(crosshairX, screenHeight);
      ctx.stroke();

      let crosshairLabelY = crosshairY-(screenWidth-pricebarleftposition)/8;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(priceLabelX, crosshairLabelY, Math.floor(priceLabelW), Math.floor(priceLabelH));
      let crosshairpricetext = `Rp.${getpricefromposition(visiblehigh, visiblelow, crosshairY).toFixed(2)}`;
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.fillStyle = "#000000";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(crosshairpricetext, pricebarleftposition + priceLabelW/2 - priceTextW/2, crosshairLabelY + priceLabelH/2);
    }

    // Bottombar
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, screenHeight-Ybottombar, pricebarleftposition, Ybottombar);
    if (ismovingbottombar) {
      ctx.strokeStyle = "#00ffff";
    } else {
      ctx.strokeStyle = "#888888";
    }
    ctx.beginPath();
    ctx.moveTo(0, screenHeight-Ybottombar);
    ctx.lineTo(pricebarleftposition, screenHeight-Ybottombar);
    ctx.stroke();
    
    const ismargincall = equity < margin*0.4;
    ctx.fillStyle = ismargincall ? "#EC7017" : "#ffffff";
    const equitytxt = `Equity: ${Number(equity).toFixed(2)}`;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(equitytxt, 0, screenHeight-Ybottombar+screenHeight*0.01);

    ctx.fillStyle = ismargincall ? "#EC7017" : "#ffffff";
    const margintxt = `Margin: ${Number(margin).toFixed(2)}`;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(margintxt, 0, screenHeight-Ybottombar+screenHeight*0.01+unitedFontSize*1);

    ctx.fillStyle = ismargincall ? "#EC7017" : "#ffffff";
    const freemargintxt = `Free Margin: ${Number(freemargin).toFixed(2)}`;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(freemargintxt, 0, screenHeight-Ybottombar+screenHeight*0.01+unitedFontSize*2);

    ctx.fillStyle = Number(floatingpl) < 0? "#EA4C4C" : "#3183FF";
    const floatingpltxt = `Floating P/L: ${Number(floatingpl) < 0 ? `${Number(floatingpl).toFixed(2)}`: `+${Number(floatingpl).toFixed(2)}`}`;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(floatingpltxt, 0, screenHeight-Ybottombar+screenHeight*0.01+unitedFontSize*3);
    
    ctx.strokeStyle = "#444444";
    ctx.beginPath();
    ctx.moveTo(0,screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*4)
    ctx.lineTo(pricebarleftposition,screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*4)
    ctx.stroke();
    
    const padding = unitedFontSize/4;
    ctx.fillStyle = "#ffffff";
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Positions", pricebarleftposition/2, screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*4+padding);
    
    ctx.strokeStyle = "#444444";
    ctx.beginPath();
    ctx.moveTo(0, screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*5+padding*2);
    ctx.lineTo(pricebarleftposition, screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*5+padding*2);
    ctx.stroke();
    
    // render positions detail in bottombar
    ctx.save();
    ctx.beginPath();
    const positionsstartingposition = screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*5+padding*2;
    ctx.rect(0,positionsstartingposition,pricebarleftposition,screenHeight-positionsstartingposition);
    ctx.clip();
    // render shits
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      // Ticket
      ctx.fillStyle = "#ffffff";
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`#${pos.ticket}`, screenWidth*0.075 + bottombarXoffset, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding + bottombarYoffset);
      
      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(screenWidth*0.15+bottombarXoffset,positionsstartingposition+unitedFontSize*i+bottombarYoffset);
      ctx.lineTo(screenWidth*0.15+bottombarXoffset,positionsstartingposition+unitedFontSize*(i+1)+padding*(i+1)*2+bottombarYoffset);
      ctx.stroke();
      // Side
      ctx.fillStyle = pos.side === "long" ? "#3183ff" : "#EA4C4C";
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(pos.side === "long"? "BUY" : "SELL", screenWidth*0.2 + bottombarXoffset, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding + bottombarYoffset);
      
      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(screenWidth*0.25+bottombarXoffset,positionsstartingposition+unitedFontSize*i+bottombarYoffset);
      ctx.lineTo(screenWidth*0.25+bottombarXoffset,positionsstartingposition+unitedFontSize*(i+1)+padding*(i+1)*2+bottombarYoffset);
      ctx.stroke();
      
      // Lot
      ctx.fillStyle = "#ffffff";
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(pos.lot, screenWidth*0.3 + bottombarXoffset, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding + bottombarYoffset);
      
      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(screenWidth*0.35+bottombarXoffset,positionsstartingposition+unitedFontSize*i+bottombarYoffset);
      ctx.lineTo(screenWidth*0.35+bottombarXoffset,positionsstartingposition+unitedFontSize*(i+1)+padding*(i+1)*2+bottombarYoffset);
      ctx.stroke();
      
      // Open Price
      ctx.fillStyle = "#ffffff";
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(Number(pos.open).toFixed(2), screenWidth*0.425+bottombarXoffset, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding+bottombarYoffset);
      
      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(screenWidth*0.5+bottombarXoffset,positionsstartingposition+unitedFontSize*i+bottombarYoffset);
      ctx.lineTo(screenWidth*0.5+bottombarXoffset,positionsstartingposition+unitedFontSize*(i+1)+padding*(i+1)*2+bottombarYoffset);
      ctx.stroke();
      
      // TP Price
      if(pos.tp !== -1) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(Number(pos.tp).toFixed(2), screenWidth*0.575+bottombarXoffset, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding+bottombarYoffset);
      }
      
      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(screenWidth*0.65+bottombarXoffset,positionsstartingposition+unitedFontSize*i+bottombarYoffset);
      ctx.lineTo(screenWidth*0.65+bottombarXoffset,positionsstartingposition+unitedFontSize*(i+1)+padding*(i+1)*2+bottombarYoffset);
      ctx.stroke();
      
      // SL Price
      if(pos.sl !== -1) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(Number(pos.sl).toFixed(2), screenWidth*0.725+bottombarXoffset, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding+bottombarYoffset);
      }
      
      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(screenWidth*0.8+bottombarXoffset,positionsstartingposition+unitedFontSize*i+bottombarYoffset);
      ctx.lineTo(screenWidth*0.8+bottombarXoffset,positionsstartingposition+unitedFontSize*(i+1)+padding*(i+1)*2+bottombarYoffset);
      ctx.stroke();
      
      // Current Price
      ctx.fillStyle = "#ffffff";
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(pos.side === "long"? Number(currentprice).toFixed(2) : Number(currentaskprice).toFixed(2), screenWidth*0.875+bottombarXoffset, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding+bottombarYoffset);
      
      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(screenWidth*0.95+bottombarXoffset,positionsstartingposition+unitedFontSize*i+bottombarYoffset);
      ctx.lineTo(screenWidth*0.95+bottombarXoffset,positionsstartingposition+unitedFontSize*(i+1)+padding*(i+1)*2+bottombarYoffset);
      ctx.stroke();
      
      // Floating P/L
      ctx.fillStyle = pos.floatingpl > 0 ? "#3183FF" : "#EA4C4C";
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(pos.floatingpl > 0 ?  `+${Number(pos.floatingpl).toFixed(2)}` : `-${Math.abs(Number(pos.floatingpl)).toFixed(2)}`, screenWidth*1.025+bottombarXoffset, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding+bottombarYoffset);
      
      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(screenWidth*1.1+bottombarXoffset,positionsstartingposition+unitedFontSize*i+bottombarYoffset);
      ctx.lineTo(screenWidth*1.1+bottombarXoffset,positionsstartingposition+unitedFontSize*(i+1)+padding*(i+1)*2+bottombarYoffset);
      ctx.stroke();
      
      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(0, positionsstartingposition + unitedFontSize*(i+1)+padding*(i+1)*2+bottombarYoffset);
      ctx.lineTo(pricebarleftposition, positionsstartingposition + unitedFontSize*(i+1)+padding*(i+1)*2+bottombarYoffset);
      ctx.stroke();
    }
    
    ctx.restore();
    // its masked!
    

    document.getElementById("order_buy").style.backgroundColor = askIsGoingUp? "#3183FF": "#EA4C4C";
    document.getElementById("order_sell").style.backgroundColor = bidIsGoingUp? "#3183FF": "#EA4C4C";
    document.getElementById("order_buy").textContent = `BUY\n${Number(currentaskprice).toFixed(2)}`;
    document.getElementById("order_sell").textContent = `SELL\n${Number(currentprice).toFixed(2)}`;

    if (candles) {
      let lastSessionCandleOpen = (candles[candles.length - 1 - (candleIndex%100)]?.open) ?? currentopen;
      const cip = document.getElementById("changeinpercentage");
      const cp = document.getElementById("currentprice");
      const civ = document.getElementById("changeinvalue");
      cip.textContent = currentprice - lastSessionCandleOpen < 0 ? `-${Math.abs(Number(currentprice-lastSessionCandleOpen)/lastSessionCandleOpen*100).toFixed(2)}%`: `+${Number((currentprice-lastSessionCandleOpen)/lastSessionCandleOpen*100).toFixed(2)}%`
      cp.textContent = Number(currentprice).toFixed(2);
      civ.textContent = (currentprice - lastSessionCandleOpen).toFixed(2);

      civ.style.color = currentprice - lastSessionCandleOpen < 0 ? "#ff0000": "#00ff00";
      cip.style.color = currentprice - lastSessionCandleOpen < 0 ? "#ff0000": "#00ff00";
      cp.style.color = currentprice - lastSessionCandleOpen < 0 ? "#ff0000": "#00ff00";
    }

    if (positionfound) {
      let ordertpel = document.getElementById("ordertp");
      if (chosenposition.tp === -1 && !iscurrentlychoosingtp) {
        ordertpel.style.backgroundColor = "#00000000";
        ordertpel.style.color = "#00ff22";
      } else {
        ordertpel.style.backgroundColor = "#00ff22";
        ordertpel.style.color = "#000000";
      }
      let orderslel = document.getElementById("ordersl");
      if (chosenposition.sl === -1 && !iscurrentlychoosingsl) {
        orderslel.style.backgroundColor = "#00000000";
        orderslel.style.color = "#ff0011";
      } else {
        orderslel.style.backgroundColor = "#ff0011";
        orderslel.style.color = "#000000";
      }
    }
    if (pingtime != undefined) {
      if (Number(pingtime) !== 999) {
        document.getElementById("pingtime").textContent = `${Number(pingtime).toFixed(2)}ms`;
      } else {
        document.getElementById("pingtime").textContent = `${Number(pingtime).toFixed(2)}ms+`;
      }
    } else {
      document.getElementById("pingtime").textContent = "Pinging...";
    }
    if (isCurrentlyInConfirmationScreen) {
      document.getElementById("changeorderconfirmation").style.display = "";
      document.getElementById("displaycurrentprice").textContent = currentprice.toFixed(2);
      if (bidIsGoingUp) {
        document.getElementById("displaycurrentprice").style.color = "#00aaff";
      } else {
        document.getElementById("displaycurrentprice").style.color = "#ff1100";
      }
      document.getElementById("displaycurrentask").textContent = currentaskprice.toFixed(2);
      if (askIsGoingUp) {
        document.getElementById("displaycurrentask").style.color = "#00aaff";
      } else {
        document.getElementById("displaycurrentask").style.color = "#ff1100";
      }
      document.getElementById("positiondetail").textContent = `${chosenposition.side === "short" ? "Sell": "Buy"} ${chosenposition.lot} ALDIDR at ${chosenposition.open.toFixed(2)}`
      document.getElementById("modifypositiontext").textContent = `${ismodifyingorclosing === "modifying" ? "Modify": "Close"} Position #${chosenposition.ticket}`;
      document.getElementById("buttoncontinue").textContent = ismodifyingorclosing === "modifying" ? "Modify": `Close With ${chosenposition.floatingpl < 0 ? "Loss": "Profit"} ${chosenposition.floatingpl.toFixed(2)}`;
      if (ismodifyingorclosing === "closing") {
        document.getElementById("buttoncontinue").style.color = chosenposition.floatingpl < 0 ? "#ff1100": "#00aaff";
        document.getElementById("warningandinformation").textContent = "";
      } else {
        document.getElementById("warningandinformation").textContent = ismodifyingorclosing === "modifying" ? "Attention! TP and SL must differ from market price by at least 1 point": "Warning! Request is done on server side! Slippage might happen.";
        let tpinput = parseFloat(document.getElementById("tpinput").value);
        let slinput = parseFloat(document.getElementById("slinput").value);

        if (isNaN(tpinput)) tpinput = -1;
        if (isNaN(slinput)) slinput = -1;
        //console.log(chosenposition.side, tpinput, slinput);
        if (chosenposition.side === "short") {
          isallowedtocontinue =
          !(tpinput >= currentaskprice && tpinput !== -1) &&
          !(slinput <= currentaskprice && slinput !== -1);
          //console.log("tpallowed?", !(tpinput >= currentaskprice && tpinput !== -1), "slallowed?", !(slinput <= currentaskprice && slinput !== -1))
        } else {
          isallowedtocontinue =
          !(tpinput <= currentprice && tpinput !== -1) &&
          !(slinput >= currentprice && slinput !== -1);
        }
        document.getElementById("buttoncontinue").style.color = isallowedtocontinue ? "#ffffff": "#888888";
        document.getElementById("buttoncontinue").style.pointerEvents = isallowedtocontinue ? "auto": "none";
      }
    } else {
      document.getElementById("changeorderconfirmation").style.display = "none";
    }


  } // isAuth if bracket
  if (positionfound) {
    document.getElementById("ordermenu").style.display = "";
  } else {
    document.getElementById("ordermenu").style.display = "none";
  }


  requestAnimationFrame(updateloop);
}
updateloop();

function getpositionfromprice(visiblehigh, visiblelow, price) {
  if (arguments.length < 3) {
    console.error("getpositionfromprice error! expected 3 arguments!");
    return -1;
  }
  const usableheight = (screenHeight-Ymargin-Ybottombar);
  return ((visiblehigh-price)/(visiblehigh-visiblelow)*usableheight+(Ymargin/2))+Yoffset;
}

function getpricefromposition(visiblehigh, visiblelow, pos) {
  if (arguments.length < 3) {
    console.error("getpricefromposition error! expected 3 arguments!");
    return -1;
  }

  const usableHeight = screenHeight - Ymargin - Ybottombar;
  const normalized = (pos - Yoffset - (Ymargin / 2)) / usableHeight;

  return visiblehigh - normalized * (visiblehigh - visiblelow);
} // © chatgpt!

function authsuccess(data) {
  ping();
  accountid = document.getElementById("accountid").value;
  accountpassword = document.getElementById("accountpassword").value;
  localStorage.setItem("accountid", accountid);
  localStorage.setItem("accountpw", accountpassword);
  alertemblem(`Successfully logged on to account '${data.name}'!`)
  isAuth = true;
  document.getElementById("authscreen").style.display = "none";
  document.getElementById("authscreen").style.pointerEvents = "none";
  document.getElementById("authscreenclickblocker").style.display = "none";
  document.getElementById("authscreenclickblocker").style.pointerEvents = "none";
  document.getElementById("loginbutton").disabled = false;
}

function authfail() {
  alertemblem("Failed to authenticate! Please check your password/id!");
  document.getElementById("loginbutton").disabled = false;
}

function login() {
  if (!isConnectedToServer) {
    alertemblem("Error: Cant login now. disconnected from server");
    return;
  }
  const identifier = document.getElementById("accountid").value;
  const pw = document.getElementById("accountpassword").value;
  if (pw == "" || identifier == "") return;
  document.getElementById("loginbutton").disabled = true;
  ws.send(JSON.stringify({
    type: "authReq",
    id: identifier,
    password: pw
  }));
}


function resize() {
  screenWidth = window.innerWidth;
  screenHeight = window.innerHeight;

  if (screenHeight > screenWidth) {
    isOrientationVertical = true
    pricebarleftposition = screenWidth-screenWidth*0.17;
  } else {
    isOrientationVertical = false;
    pricebarleftposition = screenWidth-screenWidth*0.1;
  }
  const dpr = window.devicePixelRatio || 1;

  chart.style.width = screenWidth + "px";
  chart.style.height = screenHeight + "px";
  chart.width = Math.floor(screenWidth * dpr);
  chart.height = Math.floor(screenHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  console.log("resized");
}
window.addEventListener("resize", resize);
resize();

function alertemblem(text) {
  let emblem = document.getElementById("warningemblem");
  let detail = document.getElementById("warningdetail");
  clearTimeout(emblemtimeout);
  detail.textContent = text;
  emblem.classList.remove("emblemback");
  emblem.classList.add("emblemfall");
  emblemtimeout = setTimeout(() => {
    emblem.classList.remove("emblemfall");
    emblem.classList.add("emblemback");
  }, 3000);
}

function entry_short() {
  let raw = document.getElementById("order_lot").value;
  let lot = Number(raw);
  lot = Math.round(lot * 100)/100;
  ws.send(JSON.stringify({
    type: "openOrder",
    accid: accountid,
    accpw: accountpassword,
    side: "short",
    lot: lot,
    tp: -1,
    sl: -1
  }));
}

function entry_long() {
  let raw = document.getElementById("order_lot").value;
  let lot = Number(raw);
  lot = Math.round(lot * 100)/100;
  ws.send(JSON.stringify({
    type: "openOrder",
    accid: accountid,
    accpw: accountpassword,
    side: "long",
    lot: lot,
    tp: -1,
    sl: -1
  }));
}

function closeallposition() {
  positionfound = false;
  ws.send(JSON.stringify({
    type: "closeAll",
    accid: accountid,
    accpw: accountpassword
  }));
}

function playsound(sound) {
  if(sound === "ok") {
    ok.play();
  } else if(sound === "close") {
    ok.play();
  } else if(sound === "error") {
    
  }
}

function refresh() {
  ok = new Audio("ok.wav");
  ping();
}