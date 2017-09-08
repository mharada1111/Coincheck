// ---------------------------------------------------
// 設定
// ---------------------------------------------------

// モード ( \n は改行)

var $modes = [
  {
    "subtitle": "XRP MODE",
    "body": "XRP-C: $cc_jpy_xrp\nXRP-C: $cc_btc_xrp\nXRP-B: $bt_btc_xrp\nXRP-P: $polo_btc_xrp"
  },
  {
    "subtitle": "BTC MODE",
    "body": "BTC-C: $cc_jpy_btc\nBTC-C: $cc_usd_btc\nBTC-B: $bt_usdt_btc\nBTC-P: $polo_usdt_btc"
  },
  {
    "subtitle": "ETH MODE",
    "body": "ETH-C: $cc_jpy_eth\nETH-C: $cc_btc_eth\nBTC-B: $bt_btc_eth\nBTC-P: $polo_btc_eth"
  },
  {
    "subtitle": "Zaif MODE",
    "body": "Zaif: $zf_jpy_zaif\nXEM: $zf_jpy_xem\nMona: $zf_jpy_mona\nPePe: $zf_jpy_pepecash"
  },
  {
    "subtitle": "XRP: $cc_jpy_xrp\nXEM: $cc_jpy_xem",
    "body": "BTC: $cc_jpy_btc\nBCH: $cc_jpy_bch"
  },
]

// 更新間隔 (秒)

var $interval = 20;

// デフォルトの指数表示 ( true / false )

var $toExponential = false;

// ---------------------------------------------------
// 以下処理部
// ---------------------------------------------------

var $currentMode = 0;
var $poloJSON = {};
var $status = {};

function floatFormat(number, n) {
  var _pow = Math.pow(10, n);
  return Math.round(number * _pow) / _pow;
}

function zeroFill(num, fill) {
  var padd = "0000000000";
  return (padd + num).slice(-fill);
}

function timeText() {
  var now = new Date();
  var n = {
    month: zeroFill(now.getMonth() + 1, 2),
    date: zeroFill(now.getDate(), 2),
    hours: zeroFill(now.getHours(), 2),
    minutes: zeroFill(now.getMinutes(), 2)
  }
  return util2.format("$month/$date - $hours:$minutes", n);
}

function updatePoloJSON() {
  try {
    ajax({
      url: 'https://poloniex.com/public?command=returnTicker',
      type: 'json',
      async: false
    }, function (data) {
      $poloJSON = data;
    });
  } catch (e) {
    console.log(e);
    simply.body(e);
  }
}

try {
  ajax({
    url: 'https://coincheck.com/api/rate/all',
    type: 'json',
    async: false
  }, function (data) {
    for (var i in data["jpy"]) {
      // 丸め桁を調整する場合は、digitsを適宜設定する -> 現状CCのJPYと各取引所のUSD(T)ペアのみfloatFormatを使用
      $status["cc_jpy_" + i] = {
        "value": "xxxx",
        "digits": 2
      }
    }
    for (var i in data["btc"]) {
      $status["cc_btc_" + i] = {
        "value": "xxxx",
        "digits": 2
      }
    }
    $status["cc_usd_btc"] = {
        "value": "xxxx",
        "digits": 2
      }
  });
  ajax({
    url: 'https://api.zaif.jp/api/1/currency_pairs/all',
    type:'json',
    async: false
  }, function(data) {
    for (var i = 0; i < data.length; i++) {
      $status["zf_" + data[i]["currency_pair"].split("_").reverse().join("_")] = {
        "value": "xxxx",
        "digits": 2
      }
    }
  });
  ajax({
    url: 'https://poloniex.com/public?command=returnTicker',
    type: 'json',
    async: false
  }, function (data) {
    for (var i in data) {
      $status["polo_" + i.toLowerCase()] = {
        "value": "xxxx",
        "digits": 2
      };
    }
  });
  ajax({
    url: 'https://bittrex.com/api/v1.1/public/getmarkets',
    type: 'json',
    async: false
  }, function (data) {
    for (var i = 0; i < data["result"].length; i++) {
      $status["bt_" + data["result"][i]["MarketName"].replace("-", "_").toLowerCase()] = {
        "value": "xxxx",
        "digits": 2
      };
    }
  });
} catch (e) {
  console.log(e);
  simply.body(e);
}

function cc_update(pair, digits) {
  try {
    ajax({
      url: 'https://coincheck.com/api/rate/' + pair.replace("cc_", "").split("_").reverse().join("_"),
      type: 'json',
      async: false
    }, function (data) {
      if (pair.match(/^cc_jpy/)) {
        $status[pair]["value"] = floatFormat(data["rate"], digits);
      } else {
        if ($toExponential) {
          $status[pair]["value"] = parseFloat(data["rate"]).toExponential();
        } else {
          $status[pair]["value"] = data["rate"];
        }
      }
    });
  } catch (e) {
    console.log(e);
    simply.body(e);
  }
}

function zf_update(pair, digits) {
  try {
    ajax({
      url: 'https://api.zaif.jp/api/1/last_price/' + pair.replace("zf_", "").split("_").reverse().join("_"),
      type: 'json',
      async: false
    }, function (data) {
      if (pair.match(/^zf_jpy/)) {
        $status[pair]["value"] = floatFormat(data["last_price"], digits);
      } else {
        if ($toExponential) {
          $status[pair]["value"] = parseFloat(data["last_price"]).toExponential();
        } else {
          $status[pair]["value"] = data["last_price"];
        }
      }
    });
  } catch (e) {
    console.log(e);
    simply.body(e);
  }
}

function polo_update(pair, digits) {
  if ($poloJSON[pair.replace("polo_", "").toUpperCase()] !== undefined) {
    if (pair.match(/^polo_usdt/)) {
      $status[pair]["value"] = floatFormat($poloJSON[pair.replace("polo_", "").toUpperCase()]["last"], digits);
    } else {
      if ($toExponential) {
        $status[pair]["value"] = parseFloat($poloJSON[pair.replace("polo_", "").toUpperCase()]["last"]).toExponential();
      } else {
        $status[pair]["value"] = $poloJSON[pair.replace("polo_", "").toUpperCase()]["last"];
      }
    }
  }
}

function bt_update(pair, digits) {
  try {
    ajax({
      url: 'https://bittrex.com/api/v1.1/public/getticker?market=' + pair.replace("bt_", "").replace("_", "-").toUpperCase(),
      type: 'json',
      async: false
    }, function (data) {
      if (pair.match(/^bt_usdt/)) {
        $status[pair]["value"] = floatFormat(parseFloat(data["result"]["Last"]), digits);
      } else {
        if ($toExponential) {
          $status[pair]["value"] = parseFloat(data["result"]["Last"]).toExponential();
        } else {
          $status[pair]["value"] = data["result"]["Last"];
        }
      }
    });
  } catch (e) {
    console.log(e);
    simply.body(e);
  }
}

function updateSubtitle() {
  $subtitle_fmt = $modes[$currentMode]["subtitle"];
  for (var pair in $status) {
    $subtitle_fmt = $subtitle_fmt.replace("$" + pair, $status[pair]["value"]);
  }
  simply.subtitle($subtitle_fmt);
}

function updateBody() {
  $body_fmt = $modes[$currentMode]["body"];
  for (var pair in $status) {
    $body_fmt = $body_fmt.replace("$" + pair, $status[pair]["value"]);
  }
  simply.body($body_fmt);
}

function refresh() {
  try {
    simply.title(timeText());
    if ($modes[$currentMode]["subtitle"].match("polo_") || $modes[$currentMode]["body"].match("polo_")) {
      updatePoloJSON();
    }
    for (var pair in $status) {
      if ($modes[$currentMode]["subtitle"].match(pair) || $modes[$currentMode]["body"].match(pair)) {
        if (pair.match(/^cc_/)) {
          cc_update(pair, $status[pair]["digits"]);
        } else if (pair.match(/^zf_/)) {
          zf_update(pair, $status[pair]["digits"]);
        } else if (pair.match(/^polo_/)) {
          polo_update(pair, $status[pair]["digits"]);
        } else if (pair.match(/^bt_/)) {
          bt_update(pair, $status[pair]["digits"]);
        }
      }
    }
    updateSubtitle();
    updateBody();
  } catch (e) {
    console.log(e);
    simply.body(e);
  }
}

// イベントハンドラ

simply.on('singleClick', function (e) {
  simply.vibe();
  if (e.button == 'up') {
    $currentMode = $currentMode - 1;
    if ($currentMode == -1) {
      $currentMode = $modes.length - 1;
    }
  } else if (e.button == 'down') {
    $currentMode = $currentMode + 1;
    if ($currentMode == $modes.length) {
      $currentMode = 0;
    }
  } else if (e.button == 'select') {
    $toExponential = !$toExponential;
  }
  refresh();
});

simply.on('accelTap', function (e) {
  simply.vibe();
  refresh();
});

// エントリポイント

simply.begin = function () {
  try {
    simply.fullscreen(true);
    refresh();
    setInterval(refresh, $interval * 1000);
  } catch (e) {
    console.log(e);
    simply.body(e);
  }
};
