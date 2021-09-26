import Main from './js/main'

//new Main()


import './js/libs/weapp-adapter'
// import './js/msgParse'

//init
var initFlag = true

//server
var serverIp = ''
var serverPort = 5050 

//const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')

//屏幕
var windowHeight = wx.getSystemInfoSync().windowHeight
var windowWidth = wx.getSystemInfoSync().windowWidth


//准备信息
var readybtn = new MyBtn()
readybtn.words = "  准备"
readybtn.x = windowWidth - readybtn.width;
readybtn.y = windowHeight - readybtn.height;
//var readyInfos = []

//card
var cards = []
var allCards = []
var cardHeight = 60
var cardWidth = 40
var cardWordHeight = 20
var cardGap = 30
var selectUp = 20
var cardLineWidth = 3

//出牌按钮
var showBtn = new MyBtn()
showBtn.x = windowWidth/3
showBtn.y = windowHeight - cardHeight*2
showBtn.words = "  出牌"

//跳过按钮
var skipBtn = new MyBtn()
skipBtn.x = showBtn.x + 2*skipBtn.width 
skipBtn.y = showBtn.y
skipBtn.words = "  跳过"

//进入房间按钮
var EnterBtn = new MyBtn()
EnterBtn.x = windowWidth/2
EnterBtn.y = windowHeight/2
EnterBtn.words = "进入房间"

//重启游戏按钮
var restartBtn = new MyBtn()
restartBtn.x = windowWidth/2
restartBtn.y = windowHeight/2 + 2*restartBtn.height
restartBtn.words = "重启游戏"

//udp
const udp = wx.createUDPSocket()
udp.bind()

//user
var myNmae = new myWords()
var myId = -1;
var mylocalId = 2
myNmae.x = windowWidth/2
myNmae.y = 100
myNmae.words = "游客"
myNmae.fontSize = "20pt Calibri"
var userMaxCount = 5 //目前支持5个玩
//var userNames = ["游客1","游客2","游客3","游客4","游客5"]
//var userBtn = []
var userArr = []

//头像
var userImageWidth = 60
var userImageHeight = userImageWidth
var userPadding = 40

//当前轮次分数
var roundScore = new myWords()
roundScore.words = "轮次分数: 0分"
roundScore.x = windowWidth - 2*userImageWidth
roundScore.y = windowHeight - 1*userImageHeight

//scene
var sceneEnum = {
  getUserNickName: 1,
  lobby : 2,
  room : 3
}
var scene = sceneEnum.getUserNickName

//msg
var msgHeadSize = 4
var msgTpye = {
  log_in : 1,
  user_info : 2,
  ready_info : 3,
  cards_info : 4,
  show_cards_info : 5, //别人打出来的牌
  who_is_next : 6,
  round_score : 7,
  user_score : 8
}

function MyBtn()
{
  this.x = 0;
  this.y = 0;
  this.width = 100;
  this.height = 30
  this.words = "button"
  this.bgColor = "#2a5caa" //blue
  this.wordsColor = "#f15b6c" //red
  this.hide = false;
  this.imageURL
}

function Card(i)
{
  this.btn = new MyBtn()
  // this.words = "err"
  this.i = i
  this.select = false
  this.btn.width = cardWidth
  this.btn.height = cardHeight
}

function User(i)
{
  this.btn = new MyBtn()
  this.btn.words = "游客"
  this.btn.width = userImageWidth
  this.btn.height = userImageHeight

  this.readyWords = new myWords()
  this.ready = false

  this.cards = []

  this.playWords = new myWords()
  this.playWords.words = ""
  this.playWords.fontSize = "20pt Calibri"

  this.scoreWords = new myWords()
  this.scoreWords.words = "已经获得: 0 分"
}

// function readyInfo(i)
// {
//   this.words = new myWords()
//   this.words.y = userImageWidth + 20;
//   this.words.x = userImageWidth + (userPadding+userImageWidth)*i;
//   this.words.words = "未准备"
//   this.ready = false;
// }

function drawWords(w)
{
  // if(w.hide) return;
  ctx.font = w.fontSize
  ctx.fillStyle = w.wordsColor
  ctx.fillText(w.words, w.x, w.y)
}

function drawCards()
{  
  // for (var i = 0; i<playedCards.length; i++) {
  //   var card = playedCards[i]
  //   drawCustImage(card)
  // }

  for (var i = 0; i<userMaxCount; i++) {
    // console.log('card length: ' + userArr[i].cards.length)
    for (var j = 0; j<userArr[i].cards.length; j++)
    {
      var card = userArr[i].cards[j]
      drawCustImage(card)
    }
  }

  //console.log('card length: ' + cards.length)
  for (var i = 0; i<cards.length; i++) {
    var card = cards[i]
    drawCustImage(card)
  }
}


function selectCard(i)
{
  if(cards[i].select)
  {
      cards[i].btn.y += selectUp
      cards[i].select = false
  }
  else
  {
    cards[i].btn.y -= selectUp
    cards[i].select = true
  }

}

function isBtnTouched(btn,x,y)
{
  if(x>btn.x && y>btn.y && x<btn.x+btn.width && y<btn.y+btn.height)
  {
    return true
  } 
  return false
}

function touchHandler(event)
{
  if(scene == sceneEnum.lobby)
  {
    lobbyTochHandler(event)
  }
  else
  {
    roomTouchHandler(event)
  }
}

function lobbyTochHandler(event)
{
  var x = event.touches[0].clientX
  var y = event.touches[0].clientY
  if(isBtnTouched(EnterBtn, x, y))
  {
    scene = sceneEnum.room
    sendLoginMsg();
    return
  }

}


function removeCards()
{
  var i = 0;
  var j = 0;
  var sendCards = []
  for(i=cards.length-1;i>=0;i--)
  {
    if(cards[i].select == true) {
        cards.splice(i, 1);
    }
  }
  for(i = 0;i<cards.length;i++)
  {
    cards[i].btn.x = i*cardGap+cardWidth;
  }
  // console.log('lsp==playedCard: ' + playedCards.length)
  // playedCards.reverse()
  // showPlayedCards()

  updateCanvas()
}

function playCards()
{
  var i = 0;
  var j = 0;
  var sendCards = []

  for(i=0;i<cards.length;i++)
  {
    if(cards[i].select == true) {
      sendCards.push(cards[i].i)
    }
  }
  sendShowCardsInfoMsg(sendCards)
}

function skipPlay()
{
  var sendCards = []
  sendShowCardsInfoMsg(sendCards)
}

function showPlayedCards() {
    for (var i = 0; i < playedCards.length; i++) {
      var card = playedCards[i]
      card.btn.x = cardWidth * 2.5 + i*cardGap;
      card.btn.y = windowHeight - cardHeight * 3;
    }
}

function roomTouchHandler(event)
{
  var x = event.touches[0].clientX
  var y = event.touches[0].clientY

  var i = 0;
  for(i=cards.length-1;i>=0;i--)
  {
    if(isBtnTouched(cards[i].btn, x, y))
    {
      selectCard(i)
      updateCanvas()
      return
    }
  }

  if(isBtnTouched(showBtn, x, y))
  {
    console.log("isShowBtnTouched");
    playCards()
    return
  }

  if(isBtnTouched(skipBtn, x, y))
  {
    console.log("skipBtn touched");
    skipPlay()
    return
  }

  if(isBtnTouched(readybtn, x, y))
  {
    console.log("isBtnTouched")
    sendReadyMsg()
    return
  }

}


export default class WxPatch{
  static fixScreen() {
    let width = canvas.width
    let height = canvas.height
 
    if ( !WxPatch.fixedScreen && height > width) {
      canvas.width = height
      canvas.height = width
      WxPatch.fixedScreen =true
      ctx.fillStyle = 'white' // 矩形颜色
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }
}

function getLocalId(i)
{

  
  var ret = (i + mylocalId - myId + 5)%5 
  return ret
}

function initUser()
{
  var i
  for(i=0;i<userMaxCount;i++)
  {
    userArr[i] = new User()
  }
  var startX =  40
  var startY =  20
  userArr[0].btn.x = startX
  userArr[0].btn.y = startY

  userArr[1].btn.x = userArr[0].btn.x
  userArr[1].btn.y = userArr[0].btn.y + userImageHeight + userPadding

  userArr[2].btn.x = startX
  userArr[2].btn.y = windowHeight - userImageHeight - userPadding-cardHeight

  userArr[4].btn.x = windowWidth - userImageWidth
  userArr[4].btn.y = userArr[0].btn.y+(cardHeight+userPadding)/2 

  userArr[3].btn.x = windowWidth - userImageWidth
  userArr[3].btn.y = userArr[4].btn.y + userImageHeight + userPadding

  for(i=0;i<userMaxCount;i++)
  {
    userArr[i].scoreWords.x = userArr[i].btn.x;
    userArr[i].scoreWords.y = userArr[i].btn.y + userArr[i].btn.height + userPadding - 5;
    if(i>=3)
    {
      userArr[i].scoreWords.x = windowWidth - 2*userArr[i].btn.width;
    }
  }
}

function initGame()
{
  WxPatch.fixScreen()
  udp.onMessage(receiveMsg)
  GetUserInfo()
  canvas.addEventListener('touchstart', touchHandler)
  //
  loadAllCards()
  initUser()
}


function initCard(arrDest, arr , x , y)
{
  var i
  arrDest.splice(0, arrDest.length)
  for(i = 0;i<arr.length;i++)
  {
    var cardValue = arr[i]
    arrDest[i] = new Card(cardValue)
    arrDest[i].btn.imageURL = "Image/" + cardValue + ".jpg"
    arrDest[i].btn.x = x + i*cardGap;
    arrDest[i].btn.y = y;
  }

}

function drawUser()
{
  var i
  for(i=0;i<userMaxCount;i++)
  {
    var u = userArr[i]
    drawBtn(u.btn)
    u.readyWords.x = u.btn.x+5
    u.readyWords.y = u.btn.y+u.btn.height+15
    if(u.ready)
    {
      u.readyWords.words = "已准备"
    }
    else{
      u.readyWords.words = "未准备"
    }

    u.playWords.y = u.btn.y + u.btn.height/2
    if(i<=mylocalId)
    {
      u.playWords.x = u.btn.x + u.btn.width + 20
    }
    else
    {
      u.playWords.x = u.btn.x - 80
    }
    drawWords(u.readyWords)
    drawWords(u.playWords)
    drawWords(u.scoreWords)
  }
}

function myWords()
{
  this.x = 0;
  this.y = 0;
  this.words = "words"
  this.fontSize = "12pt Calibri"
  this.wordsColor =  "red" //green
  this.hide = false;
}

function drawBtn(btn)
{
  if(btn.hide)  return;
  ctx.fillStyle = btn.bgColor
  ctx.fillRect(btn.x, btn.y, btn.width, btn.height)

  ctx.strokeStyle = "red"
  ctx.strokeRect(btn.x, btn.y, btn.width, btn.height)

  ctx.fillStyle = btn.wordsColor
  ctx.font = "18pt Calibri"
  ctx.fillText(btn.words, btn.x, btn.y+20)
}

function updateLobby()
{
  drawBtn(EnterBtn)
  drawWords(myNmae)
  drawBtn(restartBtn)
}

function drawCustImage(card)
{
  if (card.btn.imageURL == null) {
    console.log('lsp===card.btn.image is null: ' + card.i)
  }

  var image = wx.createImage()
  image.src = card.btn.imageURL
  image.onload = function () {
    ctx.drawImage(image,0,0,card.btn.width, card.btn.height,card.btn.x, card.btn.y,card.btn.width, card.btn.height)
  }
}

function updateCanvas()
{
  ctx.clearRect(0, 0, windowWidth, windowHeight)
  if(scene == sceneEnum.lobby)
  {
    updateLobby()
  }
  else if(scene == sceneEnum.room)
  {
    drawUser()
    drawBtn(readybtn)
    drawCards()
    drawBtn(showBtn)
    drawBtn(skipBtn)
    drawWords(roundScore)
  }

}

function sendMsg(bf)
{
  console.log("sendMsg")
  console.log(bf);
  udp.send({
    address: serverIp,
    port: serverPort,
    message: bf
  })
}

function sendShowCardsInfoMsg(arr)
{
  console.log("sendShowCardsInfoMsg, myid is "+myId)
  var nickName = myNmae.words;
  var bf = new ArrayBuffer(msgHeadSize + 2*arr.length + 4);
  var v1 = new Uint16Array(bf);
  var len = arr.length
  v1[0] = msgTpye.show_cards_info
  v1[2] = myId
  v1[3] = len
  for (var i=0,j=4; i<len; i++) {
    v1[j++] = arr[i]
    }
  console.log(bf);
  sendMsg(bf)
}

function sendReadyMsg()
{
  console.log("sendReadyMsg, myid is"+myId)
  var bf = new ArrayBuffer(msgHeadSize + 2);
  var v1 = new Uint16Array(bf);
  v1[0] = msgTpye.ready_info;
  v1[2] = myId;
  
  sendMsg(bf)
}

function copy(src, i) {
  var dst = new ArrayBuffer(src.byteLength);
  new Uint16Array(dst).set(new Uint16Array(src));
  return dst;
  }

function getWidthByCardNum(n)
{
  var ret =  cardWidth + cardGap*n;
  return ret
}

function initShowCardsofUser(i, arr)
{
  var y = userArr[i].btn.y
  var x = 0
  if(i <=2 )
  {
    x = userArr[i].btn.x + userArr[i].btn.width
  }
  else{
    x = userArr[i].btn.x - getWidthByCardNum(arr.length)
  }
  initCard(userArr[i].cards, arr, x, y);
}

function receiveMsg(res)
{
  console.log(res.message)
  var heardByteSize = 4;//head占的字节数
  var v1 = new Uint16Array(res.message, 0, 2);
  console.log("reive msg typ is" + v1[0])
  if(v1[0] == msgTpye.log_in)
  {
    let v2 = new Uint16Array(res.message, 0, 3);
    myId = v2[2]
    console.log("receive log in id = " + myId)
    //userNames[myId] = myNmae.words;
    userArr[getLocalId(myId)].btn.words = myNmae.words;
  }
  else if(v1[0] == msgTpye.user_info)
  {
    let v2 = new Uint16Array(res.message, 0, 4);
    let receiveId = v2[2]
    let readyStatus = v2[3]
    console.log("receive user info of " + receiveId + "ready status = " + readyStatus)
    userArr[getLocalId(receiveId)].btn.words = ab2str(res.message.slice(8))
    if(readyStatus)
    {
      userArr[getLocalId(receiveId)].ready = true;
    }  
  }
  else if(v1[0] == msgTpye.ready_info)
  {
    let v2 = new Uint16Array(res.message, 0, 3);
    let receiveId = v2[2]
    console.log("receive ready info of " + receiveId)
    userArr[getLocalId(receiveId)].ready = true;
  }
  else if(v1[0] == msgTpye.cards_info)
  {
    let v2 = new Uint16Array(res.message, heardByteSize, 2);
    let receiveId = v2[0]
    let cardSize = v2[1]
    let v3 = new Uint16Array(res.message, heardByteSize + 4, cardSize);

    initCard(cards, v3, cardWidth, windowHeight - cardHeight);
  }
  else if(v1[0] == msgTpye.show_cards_info)
  {
    let v2 = new Uint16Array(res.message, heardByteSize, 2);
    let receiveId = v2[0]
    let cardSize = v2[1]
    let v3 = new Uint16Array(res.message, heardByteSize + 4, cardSize);
    let localId = getLocalId(receiveId)
    console.log("receive id " + receiveId + " local id" + localId);
    if(v3.length == 0)
    {
      userArr[localId].playWords.words = "不出"
    }
    else
    {
      userArr[localId].playWords.words = ""
    }
    initShowCardsofUser(localId, v3)
    if(receiveId == myId && v3.length != 0)
    {
      removeCards();
    }
  }
  else if(v1[0] == msgTpye.who_is_next)
  {
    let v2 = new Uint16Array(res.message, heardByteSize, 1);
    console.log("who_is_next id = " + v2[0])

    let localId = getLocalId(v2[0])
    console.log("who_is_next localId = " + localId)
    userArr[localId].playWords.words = "请出牌"
    initShowCardsofUser(localId, [])
  }
  else if(v1[0] == msgTpye.round_score)
  {
    let v2 = new Uint16Array(res.message, heardByteSize, 1);
    roundScore.words = "轮次分数: " + v2[0] + "分"
  }
  else if(v1[0] == msgTpye.user_score)
  {
    let v2 = new Uint16Array(res.message, heardByteSize, 2);
    let receiveId = v2[0]
    let score = v2[1]
    let localId = getLocalId(receiveId)
    userArr[localId].scoreWords.words = "已经获得: "+score+" 分"
  }
  else{
    console.log("receive invalid")
  }
  
  updateCanvas()
}

async function loop() {
  for (let i = 1;i<=500;i++){
      let x = await sleep();
      console.log(i);
  }
}

function sleep(){
  return new Promise((resolve, reject)=> {
      setTimeout(()=>{
          resolve("1333")
      }, 1000)
  })
}


// ArrayBuffer转为字符串，参数为ArrayBuffer对象
function ab2str(buf) {
return String.fromCharCode.apply(null, new Uint16Array(buf));
}

// 字符串转为ArrayBuffer对象，参数为字符串
function str2ab(str) {
var buf = new ArrayBuffer(str.length*2); // 每个字符占用2个字节
var bufView = new Uint16Array(buf);
for (var i=0, strLen=str.length; i<strLen; i++) {
bufView[i] = str.charCodeAt(i);
}
return buf;
}

function sendLoginMsg()
{
  var nickName = myNmae.words;
  var bf = new ArrayBuffer(msgHeadSize + 2*nickName.length);
  var v1 = new Uint16Array(bf);
  v1[0] = 1
  v1[1] = 1
  for (var i=2, j=0, strLen=nickName.length; j<strLen; j++,i++) {
    v1[i] = nickName.charCodeAt(j);
    
    }
  //console.log(bf);
  sendMsg(bf)
}

function GetUserInfo()
{

  wx.getUserInfo({
    success: function(res) {
      console.log(res.userInfo.nickName)
      myNmae.words = res.userInfo.nickName
      scene = sceneEnum.lobby
      updateCanvas()
    },
    fail: function(res) {

      const button = wx.createUserInfoButton({
        type: 'text',
        text: '点击获取用户名',
        style: {
          left: 0,
          top: 0,
          width: windowWidth,
          height: windowHeight,
          lineHeight: 40,
          backgroundColor: '#ff0000',
          color: '#ffffff',
          textAlign: 'center',
          fontSize: 40,
          borderRadius: 4
        }
      })
      button.onTap((res) => {
        if (res && res.userInfo) {
          console.log(res.userInfo.nickName)
          myNmae.words = res.userInfo.nickName
          button.destroy()
          scene = sceneEnum.lobby
          updateCanvas()
        }
      })
    }
  })
}

console.log("start")
initGame()

function loadAllCards() {
  for (var i = 0; i < 54; i++) {
    var image = wx.createImage()
    image.src = "Image/" + (i + 1) + ".jpg"
    allCards[i] = image
  }
}

setTimeout(() => {
  updateCanvas() 
}, 1000);

wx.onShow((result) => {
  console.log('lsp==onShow')
  setTimeout(() => {
    updateCanvas()
  }, 1000);
})






