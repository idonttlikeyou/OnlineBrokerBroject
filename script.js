const chart = document.getElementById("chart");
const ctx = chart.getContext("2d");

const actx = new AudioContext();
const buffers = {};

async function load(name, url) {
  const r = await fetch(url);
  const b = await r.arrayBuffer();
  buffers[name] = await actx.decodeAudioData(b);
}

async function loadsounds() {
  await load("tick", "tick.wav");
  await load("ok", "ok.wav");
  await load("error", "error.wav");
  await load("close", "popup.wav");
}
loadsounds();

let audioqueue = [];

const audioqueueintervalid = setInterval(() => {
  if (audioqueue.length > 0) {
    const a = audioqueue[0];
    play(a.buf, a.vol, a.pitch);
    audioqueue.shift();
  }
}, 10);

function play(buf, vol, pitch) {
  const src = actx.createBufferSource();
  const gain = actx.createGain();

  src.buffer = buf;
  src.playbackRate.value = pitch;
  gain.gain.value = vol;

  src.connect(gain);
  gain.connect(actx.destination);
  src.start();
}

function addtoqueue(buffer, vol, pitch) {
  audioqueue.push({
    buf: buffer,
    vol: vol,
    pitch: pitch
  });
}

function playsound(sound) {
  if (sound === "ok") {
    addtoqueue(buffers.ok, 1, 1);
  } else if (sound === "close") {
    addtoqueue(buffers.close, 1, 1);
  } else if (sound === "error") {
    addtoqueue(buffers.error, 1, 1);
  }
}

let maxmsgrender = 30;
let messages = [];
let leftmostcandleinscreen = 0;
let stillrequestingcandledata = false;

let freemove = false;
// free chart movement

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
let positionhitbox;
let isunclickingrn = false;
let hasmoved = false;
let setfontsize = localStorage.getItem("setfontsize") ?? 30;
let Xoffset = 0;
let Yoffset = 0;
let Ymargin = 100;
let Ybottombar = Math.floor(screenHeight/5);
let ismovingbottombar = false;
let ismovingpositionsdisplay = false;
let bottombarXoffset = 0;
let bottombarYoffset = 0;
let iscurrentlyscaling = false;
let initialscale;
let magnetStrength = 1;
let frames = 0;
let fps = 0;

let leftmostcandleinscreenunaffectedidx = 0;
let onlineusers;
let leaderboard = [];

let candles = [];
let currentopen;
let currenthigh;
let currentlow;
let currentprice = 1;

let nextcandleclosetimeleft;

let balance;
let margin;
let equity;
let freemargin;
let floatingpl;
let leverage;

let positions = [];
let orderflows = [];
let closingpositionqueue = [];

let chosenpositionticket;
let positionfound = false;
let chosenposition;

let currentaskprice;
let candleIndex;

let sessionaskvol;
let sessionbidvol;

let currentsessionopenprice;

let totalcandlesinscreen = 20;
let visiblehigh;
let visiblelow;
let candlewidth;

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
let popuptimeout;
let pingid;

let bottombarusage = "positions";

let unitedFontSize;
let popupctx;
let colorpickercontext;

// COLORS
let foregroundColor = localStorage.getItem("foregroundColor") ?? "#ffffff";
let backgroundColor = localStorage.getItem("backgroundColor") ?? "#000000";
let bottombarColor = localStorage.getItem("bottombarColor") ?? "#000000";
let pricebarColor = localStorage.getItem("pricebarColor") ?? "#000000";
let color_bullCandle = localStorage.getItem("color_bullCandle") ?? "#00ff00";
let color_bearCandle = localStorage.getItem("color_bearCandle") ?? "#ff0000";
let color_bullWick = localStorage.getItem("color_bullWick") ?? "#00ff00";
let color_bearWick = localStorage.getItem("color_bearWick") ?? "#ff0000";
let color_sell = localStorage.getItem("color_sell") ?? "#EA4C4C";
let color_buy = localStorage.getItem("color_buy") ?? "#3183Ff";
let color_stopLoss = localStorage.getItem("color_stopLoss") ?? "#ff0000";
let color_takeProfit = localStorage.getItem("color_takeProfit") ?? "#00ff00";
let color_bidPriceLine = localStorage.getItem("color_bidPriceLine") ?? "#ff1100";
let color_askPriceLine = localStorage.getItem("color_askPriceLine") ?? "#00ffaa";
let color_lineChosen = localStorage.getItem("color_lineChosen") ?? "#00ffff";
let color_marginCall = localStorage.getItem("color_marginCall") ?? "#EC7017";
let color_clickableBlue = localStorage.getItem("color_clickableBlue") ?? "#00aaff";
let color_bidVolume = localStorage.getItem("color_bidVolume") ?? "#ff0000";
let color_askVolume = localStorage.getItem("color_askVolume") ?? "#00ff00";

let isCrosshairEnabled = false;
let crosshairX = 0;
let crosshairY = 0;
let crosshaircandleindex = 0;

let emblemtimeout;

let ok = new Audio("ok.wav");
let error = new Audio("error.wav");
let close = new Audio("popup.wav");

let symbolimg = new Image();
symbolimg.src = "ALDIDR.png";

chart.addEventListener("pointerdown", (e) => {
  chart.setPointerCapture(e.pointerId);
  hasmoved = false;
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
  hasmoved = true;
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

class orderflow {
  constructor(s,
    vol,
    prc) {
    this.s = s;
    this.vol = vol;
    this.prc = prc;
    this.time = performance.now();
  }
}



function holdingEvent() {
  if (starttouchX < pricebarleftposition && !ismovingbottombar && starttouchY < screenHeight-Ybottombar-unitedFontSize*1.5) {
    isCrosshairEnabled = true;
    crosshairXstart = touchX;
    crosshairYstart = touchY;
    crosshairX = Math.floor((crosshairXstart + (touchX - starttouchX))/candlewidth)*candlewidth + Xoffset%candlewidth + candlewidth/2;
    crosshairY = touchY;
  }
}

function clickingEvent() {
  starttouchX = touchX;
  starttouchY = touchY;
  crosshairXstart = crosshairX;
  crosshairYstart = crosshairY;
  if (starttouchY > screenHeight-Ybottombar-unitedFontSize*1.5 && starttouchY < screenHeight-Ybottombar) {
    iscurrentlyscaling = true;
    initialscale = totalcandlesinscreen;
  }
  if (Math.abs(starttouchY-(screenHeight-Ybottombar)) <= positionhitbox*0.5 && touchX < pricebarleftposition) {
    ismovingbottombar = true;
  } else if (starttouchY > screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*5+(unitedFontSize/4)*2) {
    ismovingpositionsdisplay = true;
  }
  iscurrentlymovingtp = false;
  iscurrentlymovingsl = false;
  if (Math.abs(touchY - getpositionfromprice(visiblehigh, visiblelow, temptp)) < positionhitbox && positionfound) {
    iscurrentlymovingtp = true;
  } else if (Math.abs(touchY - getpositionfromprice(visiblehigh, visiblelow, tempsl)) < positionhitbox && positionfound) {
    iscurrentlymovingsl = true;
  }
}

function movingEvent() {
  if (isCrosshairEnabled) {
    crosshairX = Math.floor((crosshairXstart + (touchX - starttouchX))/candlewidth)*candlewidth + Xoffset%candlewidth + candlewidth/2;
    crosshairY = crosshairYstart + (touchY - starttouchY);
    crosshairX = Math.min(pricebarleftposition, crosshairX);
    crosshairX = Math.max(0, crosshairX);
    crosshairY = Math.min(screenHeight-Ybottombar, crosshairY);
    crosshairY = Math.max(0, crosshairY);
    if (crosshaircandleindex === candles.length) {
      if (Math.abs(getpositionfromprice(visiblehigh, visiblelow, currentopen) - crosshairY) < positionhitbox*magnetStrength) {
        crosshairY = getpositionfromprice(visiblehigh, visiblelow, currentopen);
      } else if (Math.abs(getpositionfromprice(visiblehigh, visiblelow, currentprice) - crosshairY) < positionhitbox*magnetStrength) {
        crosshairY = getpositionfromprice(visiblehigh, visiblelow, currentprice);
      } else if (Math.abs(getpositionfromprice(visiblehigh, visiblelow, currenthigh) - crosshairY) < positionhitbox*magnetStrength) {
        crosshairY = getpositionfromprice(visiblehigh, visiblelow, currenthigh);
      } else if (Math.abs(getpositionfromprice(visiblehigh, visiblelow, currentlow) - crosshairY) < positionhitbox*magnetStrength) {
        crosshairY = getpositionfromprice(visiblehigh, visiblelow, currentlow);
      }
    } else {
      if (Math.abs(getpositionfromprice(visiblehigh, visiblelow, candles[crosshaircandleindex].open) - crosshairY) < positionhitbox*magnetStrength) {
        crosshairY = getpositionfromprice(visiblehigh, visiblelow, candles[crosshaircandleindex].open);
      } else if (Math.abs(getpositionfromprice(visiblehigh, visiblelow, candles[crosshaircandleindex].close) - crosshairY) < positionhitbox*magnetStrength) {
        crosshairY = getpositionfromprice(visiblehigh, visiblelow, candles[crosshaircandleindex].close);
      } else if (Math.abs(getpositionfromprice(visiblehigh, visiblelow, candles[crosshaircandleindex].high) - crosshairY) < positionhitbox*magnetStrength) {
        crosshairY = getpositionfromprice(visiblehigh, visiblelow, candles[crosshaircandleindex].high);
      } else if (Math.abs(getpositionfromprice(visiblehigh, visiblelow, candles[crosshaircandleindex].low) - crosshairY) < positionhitbox*magnetStrength) {
        crosshairY = getpositionfromprice(visiblehigh, visiblelow, candles[crosshaircandleindex].low);
      }
    }
  }

  if (!isCrosshairEnabled && starttouchX <= pricebarleftposition && !ismovingbottombar && !iscurrentlymovingtp && !iscurrentlymovingsl && !ismovingpositionsdisplay && !iscurrentlyscaling) {
    const Xoffsetbefore = Xoffset;
    Yoffset += deltaY;
    Xoffset += deltaX;
    if (Xoffset < candlewidth*-4) {
      Xoffset = candlewidth*-4;
    }
    if (Xoffset > candlewidth*(candles.length-totalcandlesinscreen)) Xoffset = candlewidth*(candles.length-totalcandlesinscreen);
    if (candles[leftmostcandleinscreenunaffectedidx] == undefined && deltaX > 0) {
      Xoffset = Xoffsetbefore-1;
    }
  }
  if (starttouchX > pricebarleftposition) {
    Ymargin += deltaY;
    freemove = true;
  }
  if (Ymargin + Ybottombar > screenHeight*0.95) Ymargin = screenHeight*0.95 - Ybottombar;
  if (ismovingbottombar) {
    Ybottombar = screenHeight-touchY;
    Ybottombar = Math.min(Ybottombar, screenHeight/2);
    Ybottombar = Math.max(Ybottombar, unitedFontSize*4+screenHeight*0.02+(unitedFontSize/4)*2+unitedFontSize);
  }
  if (ismovingpositionsdisplay) {
    bottombarXoffset += deltaX;
    bottombarYoffset += deltaY;
    bottombarYoffset = Math.max(bottombarYoffset, (((unitedFontSize*positions.length + (unitedFontSize/4)*positions.length*2)-(screenHeight-(screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*5+(unitedFontSize/4)*2)))*-1) - screenHeight*0.04-unitedFontSize);
    bottombarYoffset = Math.min(bottombarYoffset, 0);
    bottombarXoffset = Math.min(bottombarXoffset, 0);
    bottombarXoffset = Math.max(bottombarXoffset, screenWidth/-1.6-(screenWidth-pricebarleftposition));
  }
  if (iscurrentlymovingtp) {
    temptp = getpricefromposition(visiblehigh, visiblelow, touchY);
  } else if (iscurrentlymovingsl) {
    tempsl = getpricefromposition(visiblehigh, visiblelow, touchY);
  }
  if (iscurrentlyscaling) {
    totalcandlesinscreen = initialscale + Math.floor((touchX - starttouchX)/candlewidth);
    totalcandlesinscreen = Math.min(totalcandlesinscreen, Math.floor(screenWidth));
    totalcandlesinscreen = Math.max(totalcandlesinscreen, 10);
  }
}

function onlyClickingEvent() {
  isCrosshairEnabled = false;
  positionfound = false;
  iscurrentlychoosingtp = false;
  iscurrentlychoosingsl = false;
  if (touchY < screenHeight-Ybottombar-unitedFontSize*1.5) {
    for (const pos of positions) {
      if (Math.abs(touchY - getpositionfromprice(visiblehigh, visiblelow, pos.open)) < positionhitbox) {
        chosenpositionticket = pos.ticket;
        positionfound = true;
        chosenposition = pos;
        temptp = pos.tp;
        tempsl = pos.sl;
        document.getElementById("tpinput").value = "";
        document.getElementById("slinput").value = "";
        break;
      }
    }
    if (!positionfound) {
      iscurrentlychoosingtp = false;
      iscurrentlychoosingsl = false;
      temptp = -1;
      tempsl = -1;
      document.getElementById("tpinput").value = "";
      document.getElementById("slinput").value = "";
    }
  }
  if (starttouchX < pricebarleftposition && !ismovingbottombar && starttouchY > screenHeight-Ybottombar-unitedFontSize*1.5 && starttouchY < screenHeight-Ybottombar) {
    popup(`<button onclick="togglefreemove();">${freemove?"Auto scale": "Free chart movement"}</button><br><button onclick="resetverticalscale()">Reset vertical scale</button>`, false, true)
  }
}

function unclickEvent() {
  ismovingbottombar = false;
  ismovingpositionsdisplay = false;
  isunclickingrn = true;
  iscurrentlyscaling = false;
}

let isConnectedToServer = false;
let accountid;
let accountpassword;
let accountname;
let isAuth = false;

document.getElementById("accountid").value = localStorage.getItem("accountid");
document.getElementById("accountpassword").value = localStorage.getItem("accountpw");
accountid = document.getElementById("accountid").value;
accountpassword = document.getElementById("accountpassword").value;
document.getElementById("popupbox").style.display = "none";
document.getElementById("popuptouchblocker").style.display = "none";
document.getElementById("colorpicker").style.display = "none";
document.getElementById("globalchat").style.display = "none";

document.getElementById("order_lot").value = 0.01;

let ws;
let bytesOut = 0;
let bytesIn = 0;
let KBin = 0;
let KBout = 0;
const originalSend = WebSocket.prototype.send;

WebSocket.prototype.send = function (data) {
  let size = 0;
  if (typeof data === "string") {
    size = new TextEncoder().encode(data).length;
  } else if (data instanceof Blob) {
    size = data.size;
  } else if (data instanceof ArrayBuffer) {
    size = data.byteLength;
  }
  bytesOut += size;
  originalSend.call(this, data);
};

const ip = "192.168.0.109"; // permanent ig
const port = 3000;
const url = "broker.aldrichprojects.online"

// server connection watch
function connect() {
  alertemblem("Connecting to server...");
  //ws = new WebSocket(`ws://${ip}:${port}`);
  ws = new WebSocket(`wss://${url}`);

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
    let size = 0;

    if (typeof e.data === "string") {
      size = new TextEncoder().encode(e.data).length;
    } else if (e.data instanceof Blob) {
      size = e.data.size;
    }
    bytesIn += size;
    if (data.type === "priceupdate") {
      askIsGoingUp = data.askprice > currentaskprice ? true: false;
      bidIsGoingUp = data.currentprice > currentprice ? true: false;
      currentprice = +data.currentprice;
      currentopen = +data.currentopen;
      currentlow = +data.currentlow;
      currenthigh = +data.currenthigh;
      currentaskprice = +data.askprice;
      nextcandleclosetimeleft = +data.candletimeleft;
      for (const pos of positions) {
        if (pos.side === "long") {
          pos.floatingpl = (currentprice - pos.open)*pos.lot*100;
        } else if (pos.side === "short") {
          pos.floatingpl = (pos.open - currentaskprice)*pos.lot*100;
        }
      }
    } else if (data.type === "ping") {
      pingedEvent();
    } else if (data.type === "auth_response") {
      if (data.response === "auth_success") {
        authsuccess(data);
      } else {
        authfail();
      }
    } else if (data.type === "historicalpriceupdate") {
      candleIndex = +data.candleidx;
      updatecandledata(data);
      switchcandlelasttime = +data.timesincelastchange;
      nextcandleclose = +data.nextcandleclose;
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
      balance = +data.balance;
      margin = +data.margin;
      equity = +data.equity;
      freemargin = +data.freemargin;
      floatingpl = +data.floatingpl;
      leverage = +data.leverage;
    } else if (data.type === "positionsUpdate") {
      positions = data.positions;
      for (const pos of positions) {
        if (pos.side === "long") {
          pos.floatingpl = (currentprice - pos.open)*pos.lot*100;
        } else if (pos.side === "short") {
          pos.floatingpl = (pos.open - currentaskprice)*pos.lot*100;
        }
        if (Number(pos.ticket) === Number(chosenpositionticket)) {
          chosenposition = pos;
        }
      }
    } else if (data.type === "orderflow") {
      const ordflw = new orderflow(data.s, data.vol, data.prc);
      if (data.s === "short") {
        addtoqueue(buffers.tick, Math.max(Math.min(data.vol/(currentprice/100), 1), 0.1), 0.7);
      } else {
        addtoqueue(buffers.tick, Math.max(Math.min(data.vol/(currentprice/100), 1), 0.1), 1.2);
      }
      orderflows.push(ordflw);
      if (orderflows.length > 100) {
        orderflows = orderflows.slice(-100);
      }
      sessionbidvol = data.sessionbidvol;
      sessionaskvol = data.sessionaskvol;
    } else if (data.type === "unAuth") {
      isAuth = false;
      document.getElementById("authscreen").style.display = "";
      document.getElementById("authscreen").style.pointerEvents = "";
      document.getElementById("authscreenclickblocker").style.display = "";
      document.getElementById("authscreenclickblocker").style.pointerEvents = "";
    } else if (data.type === "newmessage") {
      newmessage(data);
    } else if (data.type === "accrequests") {
      let txt = "[\n";
      for (const acc of data.data) {
        txt += `  {id: ${acc.id}, name: ${acc.name}, reqbal: ${acc.balance}},\n`;
      }
      txt += "]";
      popup(`<h3>Pending account requests</h3><br><p class="enablewspc">${txt}</p>`, false, true);
    } else if (data.type === "popup") {
      popup(data.html, data.ok, data.cancel);
    } else if (data.type === "accstatus") {
      const displaystatus = data.status === "active" ? "Active": data.status === "pending" ? "Pending": "Denied / Not Exist";
      popup(`
        <h3>Account Status</h3>
        <span class="${data.status}">Id: ${data.id}</span><br>
        <div id="accstatusdiv">
        <span class="dot ${data.status}"></span><span>${displaystatus}</span>
        </div>
        `, true, false, "accstatusresponse");
    } else if (data.type === "closingposition") {
      closingpositionqueue.push({
        side: data.side,
        price: data.side === "short" ? currentaskprice: currentprice
      });
    } else if (data.type === "onlineusersupdate") {
      onlineusers = data.onlineusers;
    } else if (data.type === "question") {
      if (data.question === "leaderboard?" && bottombarusage === "leaderboard") {
        ws.send(JSON.stringify({
          type: "answer",
          question: "leaderboard?",
          answer: true
        }));
      }
    } else if (data.type === "leaderboardupdate") {
      leaderboard = data.users;
    }
  };
}
connect();

document.documentElement.requestFullscreen();
document.getElementById("changeorderconfirmation").style.display = "none";

function ping() {
  if (isAuth) {
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
    temptp = -1;
    tempsl = -1;
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

function secondloop() {
  KBout = bytesOut/1024;
  KBin = bytesIn/1024;
  bytesOut = 0;
  bytesIn = 0;
  fps = frames;
  frames = 0;
}

setInterval(() => {
  secondloop();
}, 1000);

function updateloop() {
  frames++;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, screenWidth, screenHeight);
  if (isAuth) {
    candlewidth = pricebarleftposition/totalcandlesinscreen;
    // bottomdetails
    ctx.fillStyle = bottombarColor;
    ctx.fillRect(0, screenHeight-Ybottombar-unitedFontSize*1.5, pricebarleftposition, unitedFontSize*1.5);
    ctx.strokeStyle = "#888888";
    ctx.beginPath();
    ctx.moveTo(0, screenHeight-Ybottombar-unitedFontSize*1.5);
    ctx.lineTo(pricebarleftposition, screenHeight-Ybottombar-unitedFontSize*1.5);
    ctx.stroke();
    if (!freemove) {
      visiblehigh = candles[leftmostcandleinscreen]?.high ?? currenthigh;
      visiblelow = candles[leftmostcandleinscreen]?.low ?? currentlow;
      for (let i = leftmostcandleinscreen; i < leftmostcandleinscreen+totalcandlesinscreen; i++) {
        if (candles[i] == undefined) continue;
        visiblehigh = Math.max(visiblehigh, candles[i].high);
        visiblelow = Math.min(visiblelow, candles[i].low);
      }
      if (pricebarleftposition+candlewidth*3+Xoffset < screenWidth && pricebarleftposition+Xoffset > 0) {
        visiblehigh = Math.max(visiblehigh, currenthigh);
        visiblelow = Math.min(visiblelow, currentlow);
      }
      Yoffset = 0;
    }

    let leftmostcandleposition = pricebarleftposition - candles.length*candlewidth;

    leftmostcandleinscreenunaffectedidx = Math.round((candlewidth - (leftmostcandleposition + Xoffset))/candlewidth)-6;

    for (let i = 0; i < candles.length; i++) {
      if (i%Math.floor(totalcandlesinscreen/4) === 0) {
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.fillStyle = foregroundColor;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(`${i}`, leftmostcandleposition+((i-1)*candlewidth)+candlewidth/2+Xoffset, screenHeight-Ybottombar-unitedFontSize*0.75);
      }
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, (screenHeight/100)*5, pricebarleftposition, screenHeight-Ybottombar-unitedFontSize*1.5-(screenHeight/100)*5);
    ctx.clip();
    for (let i = 0; i < candles.length; i++) {
      let candle = candles[i];
      if (candles[i-5] == undefined) continue;
      if (leftmostcandleposition+((i+5)*candlewidth)+candlewidth+Xoffset < -candlewidth || leftmostcandleposition+((i+1)*candlewidth)+Xoffset > screenWidth+candlewidth) continue;
      // i dont wanna waste resources to render
      if (leftmostcandleposition+((i-1)*candlewidth)+candlewidth/2+Xoffset > 0 && leftmostcandleposition+((i-1)*candlewidth)+candlewidth/2+Xoffset < candlewidth) {
        leftmostcandleinscreen = i;
      }

      if (i === leftmostcandleinscreen) {
        /*ctx.strokeStyle = "#00aaff";
        ctx.beginPath();
        ctx.moveTo(leftmostcandleposition+((i-1)*candlewidth)+candlewidth/2+Xoffset, 0)
        ctx.lineTo(leftmostcandleposition+((i-1)*candlewidth)+candlewidth/2+Xoffset, screenHeight);
        ctx.stroke();*/
        if (leftmostcandleposition+((leftmostcandleinscreen-1)*candlewidth)+candlewidth/2+Xoffset > candlewidth) {
          leftmostcandleinscreen -= 1;

          if (!stillrequestingcandledata) {
            getcandledata(leftmostcandleinscreen-10, 10);
          }
        }
      }

      for (let i = 20; i > -20; i--) {
        if (leftmostcandleinscreen-i < candles.length && candles[leftmostcandleinscreen-i] == undefined && !stillrequestingcandledata) {
          getcandledata(leftmostcandleinscreen-i-3, i+6);
        }
      }

      const candlebodytop = Math.min(getpositionfromprice(visiblehigh, visiblelow, candle.close), getpositionfromprice(visiblehigh, visiblelow, candle.open))
      const candleheight = Math.abs(getpositionfromprice(visiblehigh, visiblelow, candle.open) - getpositionfromprice(visiblehigh, visiblelow, candle.close));

      // historical candle
      ctx.strokeStyle = candle.open > candle.close? color_bearWick: color_bullWick;
      ctx.beginPath();
      ctx.moveTo(leftmostcandleposition+((i-1)*candlewidth)+candlewidth/2+Xoffset, getpositionfromprice(visiblehigh, visiblelow, candle.high))
      ctx.lineTo(leftmostcandleposition+((i-1)*candlewidth)+candlewidth/2+Xoffset, getpositionfromprice(visiblehigh, visiblelow, candle.low));
      ctx.stroke();

      ctx.fillStyle = candle.open > candle.close? color_bearCandle: color_bullCandle;
      ctx.fillRect(leftmostcandleposition+((i-1)*candlewidth)+Xoffset+candlewidth/8, candlebodytop, candlewidth-((candlewidth/8)*2), candleheight);

      if (leftmostcandleposition+((i-1)*candlewidth)+Xoffset < crosshairX && leftmostcandleposition+((i-1)*candlewidth)+Xoffset+candlewidth > crosshairX) {
        crosshaircandleindex = i;
      }
    }
    if (pricebarleftposition-candlewidth+Xoffset < crosshairX) {
      crosshaircandleindex = candles.length;
    }
    const currentpricepos = getpositionfromprice(visiblehigh, visiblelow, currentprice);
    const currentopenpos = getpositionfromprice(visiblehigh, visiblelow, currentopen);
    const currentbodytop = Math.min(currentpricepos, currentopenpos);
    const currentheight = Math.abs(getpositionfromprice(visiblehigh, visiblelow, currentopen) - getpositionfromprice(visiblehigh, visiblelow, currentprice));

    // current candle
    ctx.strokeStyle = currentopenpos < currentpricepos ? color_bearWick: color_bullWick;
    ctx.beginPath();
    ctx.moveTo(pricebarleftposition-candlewidth+candlewidth/2+Xoffset, getpositionfromprice(visiblehigh, visiblelow, currenthigh));
    ctx.lineTo(pricebarleftposition-candlewidth+candlewidth/2+Xoffset, getpositionfromprice(visiblehigh, visiblelow, currentlow));
    ctx.stroke();

    ctx.fillStyle = currentopenpos < currentpricepos ? color_bearCandle: color_bullCandle;
    ctx.fillRect(pricebarleftposition-candlewidth+Xoffset+candlewidth/8, currentbodytop, candlewidth-((candlewidth/8)*2), currentheight);
    ctx.restore();
    // UI RENDER
    // Pricebar
    ctx.fillStyle = pricebarColor;
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
    let priceLabelY = getpositionfromprice(visiblehigh, visiblelow, currentprice)-(screenWidth-pricebarleftposition)/8;
    let priceLabelW = screenWidth-pricebarleftposition;
    let priceLabelH = (screenWidth-pricebarleftposition)/4;
    unitedFontSize = Math.floor(screenWidth*setfontsize/1000);
    let candlerange = visiblehigh-visiblelow;
    let pricebarwidthmax = 0;
    // price level(s)
    // if vertical divide into 12
    if (isOrientationVertical) {
      for (let i = 0; i < 11; i++) {
        let chartpricelabelquarters = `Rp.${getpricefromposition(visiblehigh, visiblelow, Math.floor(screenHeight/12 * (i+1))).toFixed(2)}`;
        ctx.font = `${unitedFontSize}px monospace`;
        let quarterw = ctx.measureText(chartpricelabelquarters).width;
        pricebarwidthmax = Math.max(pricebarwidthmax, quarterw);
        ctx.fillStyle = foregroundColor;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillText(chartpricelabelquarters, Math.floor(pricebarleftposition + priceLabelW/2 - quarterw/2), Math.floor(screenHeight/12 * (i+1)));
      }
    } else /*divide into 6 if horizontal*/ {
      for (let i = 0; i < 5; i++) {
        let chartpricelabelquarters = `Rp.${getpricefromposition(visiblehigh, visiblelow, Math.floor(screenHeight/6 * (i+1))).toFixed(2)}`;
        ctx.font = `${unitedFontSize}px monospace`;
        let quarterw = ctx.measureText(chartpricelabelquarters).width;
        pricebarwidthmax = Math.max(pricebarwidthmax, quarterw);
        ctx.fillStyle = foregroundColor;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillText(chartpricelabelquarters, Math.floor(pricebarleftposition + priceLabelW/2 - quarterw/2), Math.floor(screenHeight/6 * (i+1)));
      }
    }
    // EXPERIMENTAL
    //pricebarleftposition = screenWidth-pricebarwidthmax;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, (screenHeight/100)*5, screenWidth, screenHeight-Ybottombar-unitedFontSize*1.5-(screenHeight/100)*5);
    ctx.clip();
    // bid
    ctx.fillStyle = color_bidPriceLine;
    ctx.fillRect(priceLabelX, priceLabelY, Math.floor(priceLabelW), Math.floor(priceLabelH*2));

    let pricetext = `Rp.${Number(currentprice).toFixed(2)}`;
    ctx.font = `${unitedFontSize}px monospace`;
    let priceTextW = ctx.measureText(pricetext).width;
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(pricetext, pricebarleftposition + priceLabelW/2 - priceTextW/2, priceLabelY + priceLabelH/2);

    ctx.strokeStyle = color_bidPriceLine;
    ctx.beginPath();
    ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, currentprice));
    ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, currentprice));
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
    ctx.fillStyle = color_askPriceLine;
    ctx.fillRect(priceLabelX, askLabelY, Math.floor(priceLabelW), Math.floor(priceLabelH));

    let askpricetext = `Rp.${Number(currentaskprice).toFixed(2)}`;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(askpricetext, pricebarleftposition + priceLabelW/2 - priceTextW/2, askLabelY + priceLabelH/2);

    ctx.strokeStyle = color_askPriceLine;
    ctx.beginPath();
    ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, currentaskprice));
    ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, currentaskprice));
    ctx.stroke();
    for (const pos of positions) {
      if (positionfound && Number(pos.ticket) === Number(chosenpositionticket)) {
        ctx.strokeStyle = pos.side === "short"? color_sell: color_buy;
      } else if (positionfound) {
        ctx.strokeStyle = "#888888";
      } else {
        ctx.strokeStyle = pos.side === "short"? color_sell: color_buy;
      }

      ctx.beginPath();
      ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, pos.open));
      ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, pos.open));
      ctx.stroke();

      const postext = `${pos.side === "short" ? "SELL": "BUY"} ${pos.lot}, `;
      const floatingpltext = `${pos.floatingpl < 0 ? Number(pos.floatingpl).toFixed(2): `+${Number(pos.floatingpl).toFixed(2)}`}`;
      const postxtw = ctx.measureText(postext).width;
      ctx.font = `${unitedFontSize}px monospace`;
      if (positionfound && Number(pos.ticket) === Number(chosenpositionticket)) {
        ctx.fillStyle = pos.side === "short"? color_sell: color_buy;
      } else if (positionfound) {
        ctx.fillStyle = "#888888";
      } else {
        ctx.fillStyle = pos.side === "short"? color_sell: color_buy;
      }
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.fillText(postext, 0, getpositionfromprice(visiblehigh, visiblelow, pos.open));

      if (positionfound && Number(pos.ticket) === Number(chosenpositionticket)) {
        ctx.fillStyle = pos.floatingpl < 0? color_sell: color_buy;
      } else if (positionfound) {
        ctx.fillStyle = "#888888";
      } else {
        ctx.fillStyle = pos.floatingpl < 0? color_sell: color_buy;
      }

      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.fillText(floatingpltext, postxtw, getpositionfromprice(visiblehigh, visiblelow, pos.open));

      if (pos.tp !== -1) {
        if (positionfound) {
          ctx.strokeStyle = "#888888";
        } else {
          ctx.strokeStyle = color_takeProfit;
        }
        ctx.beginPath();
        ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, pos.tp));
        ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, pos.tp));
        ctx.stroke();
        ctx.font = `${unitedFontSize}px monospace`;
        if (positionfound) {
          ctx.fillStyle = "#888888";
        } else {
          ctx.fillStyle = color_takeProfit;
        }
        ctx.textBaseline = "bottom";
        ctx.textAlign = "left";
        ctx.fillText("TP", 0, getpositionfromprice(visiblehigh, visiblelow, pos.tp));
      }
      if (pos.sl !== -1) {
        if (positionfound) {
          ctx.strokeStyle = "#888888";
        } else {
          ctx.strokeStyle = color_stopLoss;
        }
        ctx.beginPath();
        ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, pos.sl));
        ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, pos.sl));
        ctx.stroke();
        ctx.font = `${unitedFontSize}px monospace`;
        if (positionfound) {
          ctx.fillStyle = "#888888";
        } else {
          ctx.fillStyle = color_stopLoss;
        }
        ctx.textBaseline = "bottom";
        ctx.textAlign = "left";
        ctx.fillText("SL", 0, getpositionfromprice(visiblehigh, visiblelow, pos.sl));
      }
    }

    if (closingpositionqueue.length > 0) {
      const pos = closingpositionqueue[0];
      const Ypos = getpositionfromprice(visiblehigh, visiblelow, pos.price);
      ctx.strokeStyle = "#888888";
      ctx.beginPath();
      ctx.moveTo(0, Ypos);
      ctx.lineTo(pricebarleftposition, Ypos);
      ctx.stroke();
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.fillStyle = "#888888";
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.fillText(`${pos.side === "short" ? "BUY": "SELL"}`, 0, Ypos);
      closingpositionqueue.splice(0, 1);
    }

    if (temptp !== -1) {
      ctx.strokeStyle = color_takeProfit;
      ctx.beginPath();
      ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, temptp));
      ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, temptp));
      ctx.stroke();
      ctx.fillStyle = color_takeProfit;
      const temptptxt = `TP, ${chosenposition.side === "long"? ((temptp - chosenposition.open)*chosenposition.lot*100).toFixed(2): ((chosenposition.open - temptp)*chosenposition.lot*100).toFixed(2)}, ${Math.round(Math.abs(temptp - chosenposition.open) * 100)} points`;
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.fillText(temptptxt, 0, getpositionfromprice(visiblehigh, visiblelow, temptp));
    }
    if (tempsl !== -1) {
      ctx.strokeStyle = color_stopLoss;
      ctx.beginPath();
      ctx.moveTo(0, getpositionfromprice(visiblehigh, visiblelow, tempsl));
      ctx.lineTo(pricebarleftposition, getpositionfromprice(visiblehigh, visiblelow, tempsl));
      ctx.stroke();
      ctx.fillStyle = color_stopLoss;
      const tempsltxt = `SL, ${chosenposition.side === "long"? ((tempsl - chosenposition.open)*chosenposition.lot*100).toFixed(2): ((chosenposition.open - tempsl)*chosenposition.lot*100).toFixed(2)}, ${Math.round(Math.abs(tempsl - chosenposition.open) * 100)} points`;
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.fillText(tempsltxt, 0, getpositionfromprice(visiblehigh, visiblelow, tempsl));
    }

    //crosshair
    if (isCrosshairEnabled) {
      ctx.strokeStyle = foregroundColor; // crosshaircolor
      ctx.beginPath();
      ctx.moveTo(0, crosshairY);
      ctx.lineTo(pricebarleftposition, crosshairY);
      ctx.stroke();

      ctx.strokeStyle = foregroundColor; // crosshaircolor
      ctx.beginPath();
      ctx.moveTo(crosshairX, 0);
      ctx.lineTo(crosshairX, screenHeight);
      ctx.stroke();

      let crosshairLabelY = crosshairY-(screenWidth-pricebarleftposition)/8;
      ctx.fillStyle = foregroundColor;
      ctx.fillRect(priceLabelX, crosshairLabelY, Math.floor(priceLabelW), Math.floor(priceLabelH));
      let crosshairpricetext = `Rp.${getpricefromposition(visiblehigh, visiblelow, crosshairY).toFixed(2)}`;
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.fillStyle = backgroundColor;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(crosshairpricetext, pricebarleftposition + priceLabelW/2 - priceTextW/2, crosshairLabelY + priceLabelH/2);
    }

    // Render "Time till next session"
    const timetillnextsession = `Est. Next Session Open: ${Number((((Math.floor(candleIndex/100)+1)*100-candleIndex-1)*30+(nextcandleclosetimeleft/1000)).toFixed(3)) < 0 ? "Error": `${(((Math.floor(candleIndex/100)+1)*100-candleIndex-1)*30+(nextcandleclosetimeleft/1000)).toFixed(3)}s`}`;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.fillStyle = foregroundColor;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "center";
    ctx.fillText(timetillnextsession, pricebarleftposition/2, screenHeight-Ybottombar-unitedFontSize*1.5-unitedFontSize/4);
    ctx.restore();

    if (isCrosshairEnabled) {
      const chcidx = `${crosshaircandleindex}`;
      const chcidxw = ctx.measureText(chcidx).width;
      ctx.fillStyle = foregroundColor;
      ctx.fillRect(crosshairX-(chcidxw/2)-unitedFontSize*0.25, screenHeight-Ybottombar-unitedFontSize*1.5, chcidxw+unitedFontSize*0.5, unitedFontSize*1.5);
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.fillStyle = backgroundColor;
      ctx.textBaseline = "bottom";
      ctx.textAlign = "center";
      ctx.fillText(chcidx, crosshairX, screenHeight-Ybottombar-unitedFontSize*0.25);
    }


    // Bottombar
    ctx.fillStyle = bottombarColor;
    ctx.fillRect(0, screenHeight-Ybottombar, pricebarleftposition, Ybottombar);
    if (ismovingbottombar) {
      ctx.strokeStyle = color_lineChosen;
    } else {
      ctx.strokeStyle = "#888888";
    }
    ctx.beginPath();
    ctx.moveTo(0, screenHeight-Ybottombar);
    ctx.lineTo(pricebarleftposition, screenHeight-Ybottombar);
    ctx.stroke();

    const ismargincall = equity < margin*0.4;
    ctx.fillStyle = ismargincall ? color_marginCall: foregroundColor;
    const equitytxt = `Equity: ${Number(equity).toFixed(2)}`;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(equitytxt, 0, screenHeight-Ybottombar+screenHeight*0.01);

    ctx.fillStyle = ismargincall ? color_marginCall: foregroundColor;
    const margintxt = `Margin: ${Number(margin).toFixed(2)}`;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(margintxt, 0, screenHeight-Ybottombar+screenHeight*0.01+unitedFontSize*1);

    ctx.fillStyle = ismargincall ? color_marginCall: foregroundColor;
    const freemargintxt = `Free Margin: ${Number(freemargin).toFixed(2)}`;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(freemargintxt, 0, screenHeight-Ybottombar+screenHeight*0.01+unitedFontSize*2);

    ctx.fillStyle = Number(floatingpl) < 0? color_sell: color_buy;
    const floatingpltxt = `Floating P/L: ${Number(floatingpl) < 0 ? `${Number(floatingpl).toFixed(2)}`: `+${Number(floatingpl).toFixed(2)}`}`;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(floatingpltxt, 0, screenHeight-Ybottombar+screenHeight*0.01+unitedFontSize*3);

    ctx.fillStyle = color_clickableBlue;
    ctx.font = `${Math.floor(unitedFontSize/1.5)}px monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("Edit Account Properties", pricebarleftposition-unitedFontSize/4, screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*4-unitedFontSize/4);
    const eapw = ctx.measureText("Edit Account Properties").width;
    if (isunclickingrn && touchX > pricebarleftposition-unitedFontSize/4-eapw && touchX < pricebarleftposition-unitedFontSize/4 && touchY > screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*3-unitedFontSize/4 && touchY < screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*4-unitedFontSize/4) {
      popup(`<h3>Edit Account Properties</h3><span>For account id:${accountid}</span><br><label for="accname">Name:</label><input id="accname" class="coolinput" value="${accountname}"><br><label for="acclev">Leverage:</label><input id="acclev" class="coolinput" value="${leverage}"><br><label for="accpw">Password:</label><input id="accpw" type="password" class="coolinput" value="${accountpassword}"><br><button id="logout" onclick="requestlogout()">Log Out</button>`, true, true, "editaccprop");
    }
    ctx.strokeStyle = color_clickableBlue;
    ctx.beginPath();
    ctx.moveTo(pricebarleftposition-unitedFontSize/4-eapw, screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*4-unitedFontSize/4)
    ctx.lineTo(pricebarleftposition-unitedFontSize/4, screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*4-unitedFontSize/4)
    ctx.stroke();

    ctx.fillStyle = positions.length > 0 ? "#ff0000": "#888888";
    ctx.font = `${Math.floor(unitedFontSize/1.5)}px monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("Close all position", pricebarleftposition-unitedFontSize/4, screenHeight-Ybottombar+unitedFontSize/4);
    const caw = ctx.measureText("Close all position").width;
    if (isunclickingrn && positions.length > 0 && touchX > pricebarleftposition-unitedFontSize/4-caw && touchX < pricebarleftposition-unitedFontSize/4 && touchY > screenHeight-Ybottombar+unitedFontSize/4 && touchY < screenHeight-Ybottombar+unitedFontSize/4+unitedFontSize) {
      popup(`<h3>Close all position confirmation</h3><p>Are you sure you wanted to close all position?</p><br><strong style="color: red;">This action cannot be undone.</strong><br>`, true, true, "closeallpositionconfirmation");
    }
    ctx.strokeStyle = positions.length > 0 ? "#ff0000": "#888888";
    ctx.beginPath();
    ctx.moveTo(pricebarleftposition-unitedFontSize/4-caw, screenHeight-Ybottombar+unitedFontSize/1.5+unitedFontSize/4)
    ctx.lineTo(pricebarleftposition-unitedFontSize/4, screenHeight-Ybottombar+unitedFontSize/1.5+unitedFontSize/4)
    ctx.stroke();

    if (KBin < 15) {
      ctx.fillStyle = "#ffffff";
    } else if (KBin < 30) {
      ctx.fillStyle = "#ffaa00";
    } else {
      ctx.fillStyle = "#ff2200";
    }
    ctx.font = `${unitedFontSize/1.5}px monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`Data: [In: ${KBin.toFixed(2)}KB/s | Out: ${KBout.toFixed(2)}KB/s]`, pricebarleftposition, screenHeight-Ybottombar+unitedFontSize*2.5);

    if (fps < 15) {
      ctx.fillStyle = "#ff2200";
    } else if (fps < 30) {
      ctx.fillStyle = "#ffaa00";
    } else {
      ctx.fillStyle = "#00ffaa";
    }
    ctx.font = `${unitedFontSize/1.5}px monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(`${fps} FPS`, pricebarleftposition, screenHeight-Ybottombar+unitedFontSize*2.5);

    ctx.fillStyle = "#00ff00";
    ctx.font = `${unitedFontSize/1.5}px monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(`Online Users: ${onlineusers ?? "Loading..."}`, pricebarleftposition, screenHeight-Ybottombar+unitedFontSize*3);

    ctx.strokeStyle = "#444444";
    ctx.beginPath();
    ctx.moveTo(0, screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*4)
    ctx.lineTo(pricebarleftposition, screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*4)
    ctx.stroke();

    const padding = unitedFontSize/4;
    ctx.fillStyle = color_clickableBlue;
    ctx.font = `${unitedFontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    if (bottombarusage === "positions") btmbrtxt = "Positions";
    else if (bottombarusage === "orderbook") btmbrtxt = "Order Book";
    else if (bottombarusage === "leaderboard") btmbrtxt = "Leaderboard";
    const postxtw = ctx.measureText(btmbrtxt).width;
    ctx.fillText(btmbrtxt, pricebarleftposition/2, screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*4+padding);
    
    ctx.strokeStyle = color_clickableBlue;
    ctx.beginPath();
    ctx.moveTo(pricebarleftposition/2-postxtw/2-(padding*0.5), screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*5+padding);
    ctx.lineTo(pricebarleftposition/2+postxtw/2+(padding*0.5), screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*5+padding);
    ctx.stroke();
    if (isunclickingrn && touchX > pricebarleftposition/2-postxtw/2 && touchX < pricebarleftposition/2+postxtw/2 && touchY > screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*4+padding && touchY < screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*4+padding+unitedFontSize) {
      popup('<h3>Change What Bottombar Shows</h3><br><span>Choose:</span><br><button class="textoption" onclick="showpositions()">- Positions</button><br><button class="textoption" onclick="showorderbook()">- OrderBook</button><br><button class="textoption" onclick="showleaderboard()">- Leaderboard</button>', false, true, "bottombarshows");
    }

    ctx.strokeStyle = "#444444";
    ctx.beginPath();
    ctx.moveTo(0, screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*5+padding*2);
    ctx.lineTo(pricebarleftposition, screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*5+padding*2);
    ctx.stroke();

    // render positions detail in bottombar
    ctx.save();
    ctx.beginPath();
    const positionsstartingposition = screenHeight-Ybottombar+screenHeight*0.02+unitedFontSize*5+padding*2;
    ctx.rect(0, positionsstartingposition, pricebarleftposition, screenHeight-positionsstartingposition);
    ctx.clip();
    // render shits
    if (bottombarusage === "positions") {
      if (positions.length > 0) {
        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("Ticket", screenWidth*0.075 + bottombarXoffset, positionsstartingposition + padding + bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.15+bottombarXoffset, positionsstartingposition+unitedFontSize+padding*2+bottombarYoffset);
        ctx.lineTo(screenWidth*0.15+bottombarXoffset, positionsstartingposition+bottombarYoffset);
        ctx.stroke();

        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("Type", screenWidth*0.2 + bottombarXoffset, positionsstartingposition + padding + bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.25+bottombarXoffset, positionsstartingposition+unitedFontSize+padding*2+bottombarYoffset);
        ctx.lineTo(screenWidth*0.25+bottombarXoffset, positionsstartingposition+bottombarYoffset);
        ctx.stroke();

        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("Lot", screenWidth*0.3 + bottombarXoffset, positionsstartingposition + padding + bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.35+bottombarXoffset, positionsstartingposition+unitedFontSize+padding*2+bottombarYoffset);
        ctx.lineTo(screenWidth*0.35+bottombarXoffset, positionsstartingposition+bottombarYoffset);
        ctx.stroke();

        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("Open Price", screenWidth*0.475 + bottombarXoffset, positionsstartingposition + padding + bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.6+bottombarXoffset, positionsstartingposition+unitedFontSize+padding*2+bottombarYoffset);
        ctx.lineTo(screenWidth*0.6+bottombarXoffset, positionsstartingposition+bottombarYoffset);
        ctx.stroke();

        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("TP", screenWidth*0.725 + bottombarXoffset, positionsstartingposition + padding + bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.85+bottombarXoffset, positionsstartingposition+unitedFontSize+padding*2+bottombarYoffset);
        ctx.lineTo(screenWidth*0.85+bottombarXoffset, positionsstartingposition+bottombarYoffset);
        ctx.stroke();

        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("SL", screenWidth*0.975 + bottombarXoffset, positionsstartingposition + padding + bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*1.1+bottombarXoffset, positionsstartingposition+unitedFontSize+padding*2+bottombarYoffset);
        ctx.lineTo(screenWidth*1.1+bottombarXoffset, positionsstartingposition+bottombarYoffset);
        ctx.stroke();

        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("Current Price", screenWidth*1.225 + bottombarXoffset, positionsstartingposition + padding + bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*1.35+bottombarXoffset, positionsstartingposition+unitedFontSize+padding*2+bottombarYoffset);
        ctx.lineTo(screenWidth*1.35+bottombarXoffset, positionsstartingposition+bottombarYoffset);
        ctx.stroke();

        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("Floating P/L", screenWidth*1.475 + bottombarXoffset, positionsstartingposition + padding + bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*1.6+bottombarXoffset, positionsstartingposition+unitedFontSize+padding*2+bottombarYoffset);
        ctx.lineTo(screenWidth*1.6+bottombarXoffset, positionsstartingposition+bottombarYoffset);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#888888";
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Nothing to see here :)", pricebarleftposition*0.5, screenHeight-((screenHeight-positionsstartingposition)+unitedFontSize+padding*2)/2);
      }
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        // background = blue means chosenposition
        const j = i+1;
        if (pos.ticket === chosenpositionticket && positionfound) {
          ctx.fillStyle = color_clickableBlue;
          ctx.fillRect(0, positionsstartingposition + unitedFontSize*j+padding*j*2 + bottombarYoffset, pricebarleftposition, unitedFontSize+padding*2);
        }
        // Ticket
        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(`#${pos.ticket}`, screenWidth*0.075 + bottombarXoffset, positionsstartingposition + unitedFontSize*j+padding*j*2 + padding + bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.15+bottombarXoffset, positionsstartingposition+unitedFontSize*j+bottombarYoffset);
        ctx.lineTo(screenWidth*0.15+bottombarXoffset, positionsstartingposition+unitedFontSize*(j+1)+padding*(j+1)*2+bottombarYoffset);
        ctx.stroke();
        // Side
        ctx.fillStyle = pos.side === "long" ? color_buy: color_sell;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(pos.side === "long"? "BUY": "SELL", screenWidth*0.2 + bottombarXoffset, positionsstartingposition + unitedFontSize*j+padding*j*2 + padding + bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.25+bottombarXoffset, positionsstartingposition+unitedFontSize*j+bottombarYoffset);
        ctx.lineTo(screenWidth*0.25+bottombarXoffset, positionsstartingposition+unitedFontSize*(j+1)+padding*(j+1)*2+bottombarYoffset);
        ctx.stroke();

        // Lot
        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(pos.lot, screenWidth*0.3 + bottombarXoffset, positionsstartingposition + unitedFontSize*j+padding*j*2 + padding + bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.35+bottombarXoffset, positionsstartingposition+unitedFontSize*j+bottombarYoffset);
        ctx.lineTo(screenWidth*0.35+bottombarXoffset, positionsstartingposition+unitedFontSize*(j+1)+padding*(j+1)*2+bottombarYoffset);
        ctx.stroke();

        // Open Price
        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(Number(pos.open).toFixed(2), screenWidth*0.475+bottombarXoffset, positionsstartingposition + unitedFontSize*j+padding*j*2 + padding+bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.6+bottombarXoffset, positionsstartingposition+unitedFontSize*j+bottombarYoffset);
        ctx.lineTo(screenWidth*0.6+bottombarXoffset, positionsstartingposition+unitedFontSize*(j+1)+padding*(j+1)*2+bottombarYoffset);
        ctx.stroke();

        // TP Price
        if (pos.tp !== -1) {
          ctx.fillStyle = foregroundColor;
          ctx.font = `${unitedFontSize}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(Number(pos.tp).toFixed(2), screenWidth*0.725+bottombarXoffset, positionsstartingposition + unitedFontSize*j+padding*j*2 + padding+bottombarYoffset);
        }

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.85+bottombarXoffset, positionsstartingposition+unitedFontSize*j+bottombarYoffset);
        ctx.lineTo(screenWidth*0.85+bottombarXoffset, positionsstartingposition+unitedFontSize*(j+1)+padding*(j+1)*2+bottombarYoffset);
        ctx.stroke();

        // SL Price
        if (pos.sl !== -1) {
          ctx.fillStyle = foregroundColor;
          ctx.font = `${unitedFontSize}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(Number(pos.sl).toFixed(2), screenWidth*0.975+bottombarXoffset, positionsstartingposition + unitedFontSize*j+padding*j*2 + padding+bottombarYoffset);
        }

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*1.1+bottombarXoffset, positionsstartingposition+unitedFontSize*j+bottombarYoffset);
        ctx.lineTo(screenWidth*1.1+bottombarXoffset, positionsstartingposition+unitedFontSize*(j+1)+padding*(j+1)*2+bottombarYoffset);
        ctx.stroke();

        // Current Price
        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(pos.side === "long"? Number(currentprice).toFixed(2): Number(currentaskprice).toFixed(2), screenWidth*1.225+bottombarXoffset, positionsstartingposition + unitedFontSize*j+padding*j*2 + padding+bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*1.35+bottombarXoffset, positionsstartingposition+unitedFontSize*j+bottombarYoffset);
        ctx.lineTo(screenWidth*1.35+bottombarXoffset, positionsstartingposition+unitedFontSize*(j+1)+padding*(j+1)*2+bottombarYoffset);
        ctx.stroke();

        // Floating P/L
        ctx.fillStyle = pos.floatingpl >= 0 ? color_buy: color_sell;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(pos.floatingpl > 0 ? `+${Number(pos.floatingpl).toFixed(2)}`: `-${Math.abs(Number(pos.floatingpl)).toFixed(2)}`, screenWidth*1.475+bottombarXoffset, positionsstartingposition + unitedFontSize*j+padding*j*2 + padding+bottombarYoffset);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*1.6+bottombarXoffset, positionsstartingposition+unitedFontSize*j+bottombarYoffset);
        ctx.lineTo(screenWidth*1.6+bottombarXoffset, positionsstartingposition+unitedFontSize*(j+1)+padding*(j+1)*2+bottombarYoffset);
        ctx.stroke();

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(0, positionsstartingposition + unitedFontSize*(j+1)+padding*(j+1)*2+bottombarYoffset);
        ctx.lineTo(pricebarleftposition, positionsstartingposition + unitedFontSize*(j+1)+padding*(j+1)*2+bottombarYoffset);
        ctx.stroke();

        if (isunclickingrn && !hasmoved && touchY > positionsstartingposition+unitedFontSize*i+bottombarYoffset+padding*i*2 && touchY < positionsstartingposition+unitedFontSize*(j+1)+padding*(j+1)*2+bottombarYoffset) {
          positionfound = true;
          chosenposition = pos;
          chosenpositionticket = pos.ticket;
        }
      }
    } else if (bottombarusage === "orderbook") {
      const total = sessionbidvol + sessionaskvol;
      const bidtoaskratio = total === 0 ? 0.5: sessionbidvol / total;
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = color_bidVolume;
      ctx.fillRect(0, positionsstartingposition, pricebarleftposition*bidtoaskratio, unitedFontSize+padding*2);
      ctx.fillStyle = color_askVolume;
      ctx.fillRect(pricebarleftposition*bidtoaskratio, positionsstartingposition, screenWidth-pricebarleftposition*bidtoaskratio, unitedFontSize+padding*2);
      ctx.globalAlpha = 1;
      let bidvol; if (sessionbidvol > 1000000000000) {
        bidvol = `${(sessionbidvol/1000000000000).toFixed(2)}T`;
      } else if (sessionbidvol > 1000000000) {
        bidvol = `${(sessionbidvol/1000000000).toFixed(2)}B`;
      } else if (sessionbidvol > 1000000) {
        bidvol = `${(sessionbidvol/1000000).toFixed(2)}M`;
      } else if (sessionbidvol > 1000) {
        bidvol = `${(sessionbidvol/1000).toFixed(2)}K`;
      } else {
        bidvol = `${sessionbidvol}`;
      }

      ctx.fillStyle = color_bidVolume;
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(bidvol, 0, positionsstartingposition+padding);
      let askvol;
      if (sessionaskvol > 1000000000000) {
        askvol = `${(sessionaskvol/1000000000000).toFixed(2)}T`;
      } else if (sessionaskvol > 1000000000) {
        askvol = `${(sessionaskvol/1000000000).toFixed(2)}B`;
      } else if (sessionaskvol > 1000000) {
        askvol = `${(sessionaskvol/1000000).toFixed(2)}M`;
      } else if (sessionaskvol > 1000) {
        askvol = `${(sessionaskvol/1000).toFixed(2)}K`;
      } else {
        askvol = `${sessionaskvol}`;
      }
      ctx.fillStyle = color_askVolume;
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText(askvol, pricebarleftposition, positionsstartingposition+padding);

      ctx.fillStyle = foregroundColor;
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("Side", screenWidth*0.075, positionsstartingposition+padding*3+unitedFontSize);

      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(screenWidth*0.15, positionsstartingposition+unitedFontSize+padding*2);
      ctx.lineTo(screenWidth*0.15, positionsstartingposition+unitedFontSize+padding*3+unitedFontSize);
      ctx.stroke();

      ctx.fillStyle = foregroundColor;
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("Volume", screenWidth*0.325, positionsstartingposition+padding*3+unitedFontSize);

      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(screenWidth*0.50, positionsstartingposition+unitedFontSize+padding*2);
      ctx.lineTo(screenWidth*0.50, positionsstartingposition+unitedFontSize*2+padding*3);
      ctx.stroke();

      ctx.fillStyle = foregroundColor;
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("Price", screenWidth*0.675, positionsstartingposition+padding*3+unitedFontSize);

      ctx.strokeStyle = "#444444";
      ctx.beginPath();
      ctx.moveTo(0, positionsstartingposition+unitedFontSize+padding*3+unitedFontSize);
      ctx.lineTo(pricebarleftposition, positionsstartingposition+unitedFontSize*2+padding*3);
      ctx.stroke();
      for (let i = 0; i < orderflows.length; i++) {
        const order = orderflows[orderflows.length-i-1];

        // make background pulse for current ones
        ctx.globalAlpha = 100/(performance.now() - order.time);
        ctx.fillStyle = order.s === "short"? color_bidVolume: color_askVolume;
        ctx.fillRect(0, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding*2+unitedFontSize-padding+unitedFontSize+padding*2, pricebarleftposition, unitedFontSize+padding);

        ctx.globalAlpha = 1;

        ctx.fillStyle = order.s === "short" ? color_bidVolume: color_askVolume;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(order.s, screenWidth*0.075, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding*4+unitedFontSize*2);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.15, positionsstartingposition+unitedFontSize*i+padding+unitedFontSize+padding*2+unitedFontSize);
        ctx.lineTo(screenWidth*0.15, positionsstartingposition+unitedFontSize*(i+1)+padding*(i+1)*2+padding*3+unitedFontSize*2);
        ctx.stroke();

        ctx.fillStyle = order.s === "long" ? color_buy: color_sell;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(order.vol, screenWidth*0.325, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding*4+unitedFontSize*2);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.50, positionsstartingposition+unitedFontSize*i+padding*3+unitedFontSize*2);
        ctx.lineTo(screenWidth*0.50, positionsstartingposition+unitedFontSize*(i+1)+padding*(i+1)*2+padding*3+unitedFontSize*2);
        ctx.stroke();

        ctx.fillStyle = order.s === "long" ? color_buy: color_sell;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(Number(order.prc).toFixed(2), screenWidth*0.675, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding*4+unitedFontSize*2);
      }
    } else if (bottombarusage === "leaderboard") {
      if (leaderboard.length > 0) {
        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("Rank", screenWidth*0.075, positionsstartingposition+padding);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.15, positionsstartingposition);
        ctx.lineTo(screenWidth*0.15, positionsstartingposition+unitedFontSize+padding);
        ctx.stroke();

        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("Name", screenWidth*0.325, positionsstartingposition+padding);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(screenWidth*0.50, positionsstartingposition);
        ctx.lineTo(screenWidth*0.50, positionsstartingposition+unitedFontSize+padding);
        ctx.stroke();

        ctx.fillStyle = foregroundColor;
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("Equity", screenWidth*0.675, positionsstartingposition+padding);

        ctx.strokeStyle = "#444444";
        ctx.beginPath();
        ctx.moveTo(0, positionsstartingposition+unitedFontSize+padding);
        ctx.lineTo(pricebarleftposition, positionsstartingposition+unitedFontSize+padding);
        ctx.stroke();

        for (let i = 0; i < leaderboard.length; i++) {
          const user = leaderboard[i];

          ctx.fillStyle = foregroundColor;
          ctx.font = `${unitedFontSize}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(`${i+1}`, screenWidth*0.075, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding*2+unitedFontSize);

          ctx.strokeStyle = "#444444";
          ctx.beginPath();
          ctx.moveTo(screenWidth*0.15, positionsstartingposition+unitedFontSize*i+padding+unitedFontSize);
          ctx.lineTo(screenWidth*0.15, positionsstartingposition+unitedFontSize*(i+1)+padding*(i+1)*2+padding+unitedFontSize);
          ctx.stroke();

          ctx.fillStyle = foregroundColor;
          ctx.font = `${unitedFontSize}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(user.name, screenWidth*0.325, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding*2+unitedFontSize);

          ctx.strokeStyle = "#444444";
          ctx.beginPath();
          ctx.moveTo(screenWidth*0.50, positionsstartingposition+unitedFontSize*i+padding+unitedFontSize);
          ctx.lineTo(screenWidth*0.50, positionsstartingposition+unitedFontSize*(i+1)+padding*(i+1)*2+padding+unitedFontSize);
          ctx.stroke();

          ctx.fillStyle = foregroundColor;
          ctx.font = `${unitedFontSize}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(user.equity, screenWidth*0.675, positionsstartingposition + unitedFontSize*i+padding*i*2 + padding*2+unitedFontSize);
        }
      } else {
        ctx.fillStyle = "#888888";
        ctx.font = `${unitedFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Loading...", pricebarleftposition*0.5, screenHeight-((screenHeight-positionsstartingposition)+unitedFontSize+padding*2)/2);
      }
    }

    ctx.restore();
    // its masked!


    document.getElementById("order_buy").style.backgroundColor = askIsGoingUp? color_buy: color_sell;
    document.getElementById("order_sell").style.backgroundColor = bidIsGoingUp? color_buy: color_sell;
    document.getElementById("order_buy").textContent = `BUY\n${Number(currentaskprice).toFixed(2)}`;
    document.getElementById("order_sell").textContent = `SELL\n${Number(currentprice).toFixed(2)}`;

    const tp = document.getElementById("tradingpanel").getBoundingClientRect();
    const tradingpanelbottomposition = tp.top+tp.height;

    if (candles) {
      const changeinpercentage = currentprice - currentsessionopenprice < 0 ? `-${Math.abs(Number(currentprice-currentsessionopenprice)/currentsessionopenprice*100).toFixed(2)}%`: `+${Number((currentprice-currentsessionopenprice)/currentsessionopenprice*100).toFixed(2)}%`;
      const changeinvalue = currentprice - currentsessionopenprice < 0 ? `-${Math.abs(currentprice-currentsessionopenprice).toFixed(2)}`: `+${(currentprice-currentsessionopenprice).toFixed(2)}`;
      const totaltextwidth = Math.max(ctx.measureText("ALDIDR • Aldrich Coin / Indonesia Rupiah").width, ctx.measureText(`${changeinpercentage} ${changeinvalue} ${currentprice}`).width);
      if (isunclickingrn && touchX > 0 && touchX < totaltextwidth+unitedFontSize*2 && touchY > tradingpanelbottomposition && touchY < tradingpanelbottomposition+unitedFontSize*2) {
        popup(`<h3>Settings</h3><br>
          <button onclick="changecolorpalletes()">Change Colors</button><br>
          <button onclick="chartproperties()">Properties</button><br>
          `, false, true, "options");
      }
      ctx.fillStyle = foregroundColor;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(0, tradingpanelbottomposition, totaltextwidth+unitedFontSize*2, unitedFontSize*2)
      ctx.globalAlpha = 1;
      ctx.drawImage(symbolimg, 0, tradingpanelbottomposition, unitedFontSize*2, unitedFontSize*2);
      ctx.fillStyle = foregroundColor;
      ctx.font = `${unitedFontSize}px monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("ALDIDR • Aldrich Coin / Indonesia Rupiah", unitedFontSize*2, tradingpanelbottomposition);
      ctx.fillStyle = currentprice - currentsessionopenprice > 0 ? color_askVolume: color_bidVolume;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`${changeinpercentage} ${changeinvalue} ${currentprice}`, unitedFontSize*2, tradingpanelbottomposition+unitedFontSize);
    }

    if (positionfound) {
      let ordertpel = document.getElementById("ordertp");
      if (chosenposition.tp === -1 && !iscurrentlychoosingtp) {
        ordertpel.style.backgroundColor = "#00000000";
        ordertpel.style.color = color_takeProfit;
      } else {
        ordertpel.style.backgroundColor = color_takeProfit;
        ordertpel.style.color = "#000000";
      }
      let orderslel = document.getElementById("ordersl");
      if (chosenposition.sl === -1 && !iscurrentlychoosingsl) {
        orderslel.style.backgroundColor = "#00000000";
        orderslel.style.color = color_stopLoss;
      } else {
        orderslel.style.backgroundColor = color_stopLoss;
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
      document.getElementById("displaycurrentprice").textContent = Number(currentprice).toFixed(2);
      if (bidIsGoingUp) {
        document.getElementById("displaycurrentprice").style.color = color_buy;
      } else {
        document.getElementById("displaycurrentprice").style.color = color_sell;
      }
      document.getElementById("displaycurrentask").textContent = Number(currentaskprice).toFixed(2);
      if (askIsGoingUp) {
        document.getElementById("displaycurrentask").style.color = color_buy;
      } else {
        document.getElementById("displaycurrentask").style.color = color_sell;
      }
      document.getElementById("positiondetail").textContent = `${chosenposition.side === "short" ? "Sell": "Buy"} ${chosenposition.lot} ALDIDR at ${chosenposition.open.toFixed(2)}`
      document.getElementById("modifypositiontext").textContent = `${ismodifyingorclosing === "modifying" ? "Modify": "Close"} Position #${chosenposition.ticket}`;
      document.getElementById("buttoncontinue").textContent = ismodifyingorclosing === "modifying" ? "Modify": `Close With ${chosenposition.floatingpl < 0 ? "Loss": "Profit"} ${chosenposition.floatingpl.toFixed(2)}`;
      if (ismodifyingorclosing === "closing") {
        document.getElementById("buttoncontinue").style.color = chosenposition.floatingpl < 0 ? color_sell: color_buy;
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
  // Updating ui things that are NOT related to charting.
  document.getElementById("saturation").style.background = `linear-gradient(
  to right,
  hsl(${document.getElementById("hue").value},0%,50%),
  hsl(${document.getElementById("hue").value},50%,50%),
  hsl(${document.getElementById("hue").value},100%,50%)
  )`;
  document.getElementById("lightness").style.background = `linear-gradient(
  to right,
  hsl(${document.getElementById("hue").value},100%,0%),
  hsl(${document.getElementById("hue").value},100%,50%),
  hsl(${document.getElementById("hue").value},100%,100%)
  )`;
  document.getElementById("previewcolor").style.background = `hsl(${document.getElementById("hue").value},${document.getElementById("saturation").value*100}%,${document.getElementById("lightness").value*100}%)`;


  isunclickingrn = false;
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
  accountid = document.getElementById("accountid").value;
  accountpassword = document.getElementById("accountpassword").value;
  localStorage.setItem("accountid", accountid);
  localStorage.setItem("accountpw", accountpassword);
  alertemblem(`Successfully logged on to account '${data.name}'!`)
  accountname = data.name;
  isAuth = true;
  ping();
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
  positionhitbox = Math.floor(screenHeight*0.015);
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
  alertemblem(`Requesting new sell order...`);
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
  alertemblem(`Requesting new buy order...`);
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

function refresh() {
  resize();
  ok = new Audio("ok.wav");
  error = new Audio("error.wav");
  close = new Audio("popup.wav");
  ping();
}

function popupclose() {
  let popupbox = document.getElementById("popupbox");
  let blocker = document.getElementById("popuptouchblocker");
  popupbox.classList.remove("popup");
  popupbox.classList.add("popback");
  blocker.style.display = "none";
  blocker.style.pointerEvents = "all";
  popuptimeout = setTimeout(() => {
    popupbox.style.display = "none";
  }, 300);
}

function popupok() {
  if (popupctx === "editaccprop") {
    const name = document.getElementById("accname").value;
    const leverage = document.getElementById("acclev").value;
    const pw = document.getElementById("accpw").value;
    ws.send(JSON.stringify({
      type: "changeAccountPropertiesRequest",
      id: accountid,
      name: name,
      leverage: leverage,
      oldpassword: accountpassword,
      newpassword: pw
    }));
  } else if (popupctx === "closeallpositionconfirmation") {
    closeallposition();
  } else if (popupctx === "requestlogout") {
    logout();
  }
  popupclose();
}

function popup(html, ok, cancel, context) {
  let popupbox = document.getElementById("popupbox");
  let blocker = document.getElementById("popuptouchblocker");
  clearTimeout(popuptimeout);
  popupbox.innerHTML = html + `<br><div id="popupexitbuttons">${cancel?'<button id="popupcancel" onclick="popupclose()">Cancel</button>': ''}${ok?'<button id="popupok" onclick="popupok()">OK</button>': ''}</div>`;
  popupbox.classList.remove("popback");
  popupbox.classList.add("popup");
  popupbox.style.display = "";
  blocker.style.display = "";
  blocker.style.pointerEvents = "all";
  popupctx = context;
}

function showorderbook() {
  popupclose();
  bottombarusage = "orderbook";
}

function showpositions() {
  popupclose();
  bottombarusage = "positions";
}

function showleaderboard() {
  popupclose();
  bottombarusage = "leaderboard";
}

function reloadColors() {
  foregroundColor = localStorage.getItem("foregroundColor") ?? "#ffffff";
  backgroundColor = localStorage.getItem("backgroundColor") ?? "#000000";
  bottombarColor = localStorage.getItem("bottombarColor") ?? "#000000";
  pricebarColor = localStorage.getItem("pricebarColor") ?? "#000000";
  color_bullCandle = localStorage.getItem("color_bullCandle") ?? "#00ff00";
  color_bearCandle = localStorage.getItem("color_bearCandle") ?? "#ff0000";
  color_bullWick = localStorage.getItem("color_bullWick") ?? "#00ff00";
  color_bearWick = localStorage.getItem("color_bearWick") ?? "#ff0000";
  color_sell = localStorage.getItem("color_sell") ?? "#EA4C4C";
  color_buy = localStorage.getItem("color_buy") ?? "#3183Ff";
  color_stopLoss = localStorage.getItem("color_stopLoss") ?? "#ff0000";
  color_takeProfit = localStorage.getItem("color_takeProfit") ?? "#00ff00";
  color_bidPriceLine = localStorage.getItem("color_bidPriceLine") ?? "#ff1100";
  color_askPriceLine = localStorage.getItem("color_askPriceLine") ?? "#00ffaa";
  color_lineChosen = localStorage.getItem("color_lineChosen") ?? "#00ffff";
  color_marginCall = localStorage.getItem("color_marginCall") ?? "#EC7017";
  color_clickableBlue = localStorage.getItem("color_clickableBlue") ?? "#00aaff";
  color_bidVolume = localStorage.getItem("color_bidVolume") ?? "#ff0000";
  color_askVolume = localStorage.getItem("color_askVolume") ?? "#00ff00";
}

function saveColors() {
  localStorage.setItem("foregroundColor", foregroundColor);
  localStorage.setItem("backgroundColor", backgroundColor);
  localStorage.setItem("bottombarColor", bottombarColor);
  localStorage.setItem("pricebarColor", pricebarColor);
  localStorage.setItem("color_bullCandle", color_bullCandle);
  localStorage.setItem("color_bearCandle", color_bearCandle);
  localStorage.setItem("color_bullWick", color_bullWick);
  localStorage.setItem("color_bearWick", color_bearWick);
  localStorage.setItem("color_sell", color_sell);
  localStorage.setItem("color_buy", color_buy);
  localStorage.setItem("color_stopLoss", color_stopLoss);
  localStorage.setItem("color_takeProfit", color_takeProfit);
  localStorage.setItem("color_bidPriceLine", color_bidPriceLine);
  localStorage.setItem("color_askPriceLine", color_askPriceLine);
  localStorage.setItem("color_lineChosen", color_lineChosen);
  localStorage.setItem("color_marginCall", color_marginCall);
  localStorage.setItem("color_clickableBlue", color_clickableBlue);
  localStorage.setItem("color_bidVolume", color_bidVolume);
  localStorage.setItem("color_askVolume", color_askVolume);
}

function hslToRgb(h, s, l) {
  /*s /= 100;
    l /= 100;*/

  const c = (1 - Math.abs(2*l - 1)) * s;
  const x = c * (1 - Math.abs((h/60)%2 - 1));
  const m = l - c/2;
  let r1,
  g1,
  b1;

  if (h < 60) {
    r1 = g1 = 0; r1 = c; g1 = x; b1 = 0;
  } else if (h < 120) {
    r1 = c; g1 = x; b1 = 0;
  } else if (h < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (h < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (h < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }

  const r = Math.round((r1 + m)*255);
  const g = Math.round((g1 + m)*255);
  const b = Math.round((b1 + m)*255);

  return [r,
    g,
    b];
}

function rgbToHsl(r, g, b) {
  // ubah dulu ke range 0–1
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
  s,
  l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // abu-abu, no hue
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min): d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6: 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }

  return [h,
    s*100,
    l*100]; // H = 0–360, S & L = 0–100%
}

function rgbToHex(r, g, b) {
  const hr = r.toString(16).padStart(2, '0');
  const hg = g.toString(16).padStart(2, '0');
  const hb = b.toString(16).padStart(2, '0');
  return `#${hr}${hg}${hb}`;
}

function opencolorpicker(context) {
  colorpickerctx = context;
  document.getElementById("colorcontext").textContent = `Context: ${context}`;
  document.getElementById("colorpicker").style.display = "";
}

function getcolorpickerhexvalue() {
  const rgb = hslToRgb(document.getElementById("hue").value, document.getElementById("saturation").value, document.getElementById("lightness").value);
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
}

function colorpickercancel() {
  document.getElementById("colorpicker").style.display = "none";
}

function colorpickercontinue() {
  document.getElementById("colorpicker").style.display = "none";
  if (colorpickerctx === "foreground") {
    foregroundColor = getcolorpickerhexvalue();
  } else if (colorpickerctx === "background") {
    backgroundColor = getcolorpickerhexvalue();
  } else if (colorpickerctx === "bottombar") {
    bottombarColor = getcolorpickerhexvalue();
  } else if (colorpickerctx === "pricebar") {
    pricebarColor = getcolorpickerhexvalue();
  } else if (colorpickerctx === "bullcandle") {
    color_bullCandle = getcolorpickerhexvalue();
  } else if (colorpickerctx === "bearcandle") {
    color_bearCandle = getcolorpickerhexvalue();
  } else if (colorpickerctx === "bullwick") {
    color_bullWick = getcolorpickerhexvalue();
  } else if (colorpickerctx === "bearwick") {
    color_bearWick = getcolorpickerhexvalue();
  } else if (colorpickerctx === "tp") {
    color_takeProfit = getcolorpickerhexvalue();
  } else if (colorpickerctx === "sl") {
    color_stopLoss = getcolorpickerhexvalue();
  } else if (colorpickerctx === "buy") {
    color_buy = getcolorpickerhexvalue();
  } else if (colorpickerctx === "sell") {
    color_sell = getcolorpickerhexvalue();
  } else if (colorpickerctx === "askline") {
    color_askPriceLine = getcolorpickerhexvalue();
  } else if (colorpickerctx === "bidline") {
    color_bidPriceLine = getcolorpickerhexvalue();
  } else if (colorpickerctx === "hover") {
    color_lineChosen = getcolorpickerhexvalue();
  } else if (colorpickerctx === "mc") {
    color_marginCall = getcolorpickerhexvalue();
  } else if (colorpickerctx === "clickable") {
    color_clickableBlue = getcolorpickerhexvalue();
  } else if (colorpickerctx === "bidvol") {
    color_bidVolume = getcolorpickerhexvalue();
  } else if (colorpickerctx === "askvol") {
    color_askVolume = getcolorpickerhexvalue();
  } else {
    console.error("The fuck you mean man");
  }
  saveColors();
}

function requestlogout() {
  popup(`<h3>Are you sure you wanna log out??</h3><span>(Click OK to continue)</span>`, true, true, "requestlogout")
}

function logout() {
  ws.send(JSON.stringify({
    type: "logout"
}));
isAuth = false;
messages = [];
localStorage.setItem("accountpw", "");
localStorage.setItem("accountid", "");
document.getElementById("accountid").value = localStorage.getItem("accountid");
document.getElementById("accountpassword").value = localStorage.getItem("accountpw");
accountid = document.getElementById("accountid").value;
accountpassword = document.getElementById("accountpassword").value;
document.getElementById("authscreen").style.display = "";
document.getElementById("authscreen").style.pointerEvents = "";
document.getElementById("authscreenclickblocker").style.display = "";
document.getElementById("authscreenclickblocker").style.pointerEvents = "";
}

function globalchatexit() {
document.getElementById("globalchat").style.display = "none";
}

function showglobalchat() {
document.getElementById("globalchat").style.display = "";
}

function sendmessage() {
const msg = document.getElementById("messageinput").value;
if (msg === "" || msg == undefined) return;
document.getElementById("messageinput").value = "";
ws.send(JSON.stringify({
type: "sendmessage",
username: accountname,
id: accountid,
msg: msg
}));
}

function newmessage(data) {
messages.push({
name: data.username, msg: data.message, color: data.color
});
if (messages.length > 100) {
messages.shift();
}
playsound("close");
if (document.getElementById("globalchat").style.display == "none") {
alertemblem(`${data.username}: ${data.message}`);
}
renderChat();
}

function renderChat() {
const box = document.getElementById("globalchatmessages");

const recent = messages.slice(-maxmsgrender);

let html = "";
for (let i = 0; i < recent.length; i++) {
const m = recent[recent.length-i-1];
html += `<div class="messagebox" style="color: ${m.color};"><strong>[${m.name}] </strong>${m.msg}</div>`;
}

box.innerHTML = html;
box.scrollTop = box.scrollHeight;
}

function createnewacc() {
popup(`
<h3>Request create new account</h3>
<span>Note: You wont be able to use your account until its accepted. You can check your account's avaibility using the button below.</span><br>
<button onclick="checkaccavailability()">Check Your Account Status</button><br>
<h5>Create New Account</h5>
<label for="accountnamerequest">Name: </label><br>
<input class="coolinput" id="accountnamerequest"><br>
<label for="accountpwrequest">Password: </label><br>
<input class="coolinput" id="accountpwrequest" type="password"><br>
<label for="accountpwconfirmrequest">Confirm Password: </label><br>
<input class="coolinput" id="accountpwconfirmrequest" type="password"><br>
<label for="accountbalrequest">Starting Balance (< Rp.25000) (optional): </label><br>
<input class="coolinput" id="accountbalrequest" type="number"><br>
<span id="requestwarnings" style="color: red;"></span><br>
<button style="position: fixed; left: 50%; transform: translateX(-50%);" class="button_cool" id="sendrequestbutton" onclick="requestnewaccount()">Send Request!</button>
`, false, true, "createnewacc")
}

function checkaccavailability() {
popup(`
<h3>Check account status</h3>
<label for="accountcheckid">Id: </label><br>
<input class="coolinput" id="accountcheckid"><br><br>
<button style="position: fixed; left: 50%; transform: translateX(-50%);" class="button_cool" id="sendrequestbutton" onclick="checkaccountstatus()">Check Status!</button>`, false, true, "checkaccavailability");
}

function checkaccountstatus() {
ws.send(JSON.stringify({
type: "checkaccstatus",
id: Number(document.getElementById("accountcheckid").value)
}));
}

function requestnewaccount() {
const name = document.getElementById("accountnamerequest").value;
const password = document.getElementById("accountpwrequest").value;
const confirmpw = document.getElementById("accountpwconfirmrequest").value;
if (Number(document.getElementById("accountbalrequest").value) > 25000) {
document.getElementById("accountbalrequest").value = 25000;
}
const bal = Math.max(Math.min(Number(document.getElementById("accountbalrequest").value), 25000), 0);
// lah kok 2 kali? biar apa? ya biarin😹
const requestwarnings = document.getElementById("requestwarnings");
let reqwarn = "";
if (name === "" || password === "" || confirmpw === "" || password !== confirmpw) {
// wrong!!
if (!name) reqwarn += "\nName is required!";
if (!password) reqwarn += "\nPassword is required!";
if (!confirmpw) reqwarn += "\nYou need to confirm your password!";
if (password !== confirmpw && password && confirmpw) reqwarn += "\nYour confirmation password is wrong!";
requestwarnings.textContent = reqwarn;
} else {
ws.send(JSON.stringify({
type: "newaccountrequest",
name: name,
password: password,
bal: bal
}));
popupclose();
}
}

function changecolorpalletes() {
popup(`<h3>Change Color Palletes</h3><br>
<button onclick="opencolorpicker('foreground')">Change Foreground Color</button><br>
<button onclick="opencolorpicker('background')">Change Background Color</button><br>
<button onclick="opencolorpicker('bottombar')">Change Bottom Bar Color</button><br>
<button onclick="opencolorpicker('pricebar')">Change Price Bar Color</button><br>
<button onclick="opencolorpicker('bullcandle')">Change Bull Candle Color</button><br>
<button onclick="opencolorpicker('bearcandle')">Change Bear Candle Color</button><br>
<button onclick="opencolorpicker('bullwick')">Change Bull Wick Color</button><br>
<button onclick="opencolorpicker('bearwick')">Change Bear Wick Color</button><br>
<button onclick="opencolorpicker('sell')">Change Sell Color</button><br>
<button onclick="opencolorpicker('buy')">Change Buy Color</button><br>
<button onclick="opencolorpicker('tp')">Change Target Profit Color</button><br>
<button onclick="opencolorpicker('sl')">Change Stop Loss Color</button><br>
<button onclick="opencolorpicker('bidline')">Change Bid Line Color</button><br>
<button onclick="opencolorpicker('askline')">Change Ask Line Color</button><br>
<button onclick="opencolorpicker('linechosen')">Change Line Hover Color</button><br>
<button onclick="opencolorpicker('mc')">Change Margin Call Text Color</button><br>
<button onclick="opencolorpicker('clickable')">Change Clickable Text Color</button><br>
<button onclick="opencolorpicker('askvol')">Change Ask Volume Color</button><br>
<button onclick="opencolorpicker('bidvol')">Change Bid Volume Color</button><br>
`, true, false, "changecolorpalletes");
}

function chartproperties() {
popup(``, true, true, "chartproperties")
}

function getcandledata(start, length) {
if (!stillrequestingcandledata) {
ws.send(JSON.stringify({
type: "getcandledata",
start: start,
length: length
}));
}
stillrequestingcandledata = true;
}

function updatecandledata(data) {
currentsessionopenprice = data.currentsessionopenprice;
for (let i = 0; i < data.data.length; i++) {
const c = data.data[i];
candles[Number(data.candledatastart)+i] = c;
//console.log(`set candle ${data.candledatastart+i} to`, data.data[i])
}
stillrequestingcandledata = false;
}

function togglefreemove() {
freemove = freemove ? false: true;
popupclose();
}

function resetverticalscale() {
visiblehigh = candles[leftmostcandleinscreen]?.high ?? currenthigh;
visiblelow = candles[leftmostcandleinscreen]?.low ?? currentlow;
for (let i = leftmostcandleinscreen; i < leftmostcandleinscreen+totalcandlesinscreen; i++) {
if (candles[i] == undefined) continue;
visiblehigh = Math.max(visiblehigh, candles[i].high);
visiblelow = Math.min(visiblelow, candles[i].low);
}
if (pricebarleftposition+candlewidth*3+Xoffset < screenWidth && pricebarleftposition+Xoffset > 0) {
visiblehigh = Math.max(visiblehigh, currenthigh);
visiblelow = Math.min(visiblelow, currentlow);
}
Ymargin = (screenHeight/100)*7;
Yoffset = 0;
popupclose();
}