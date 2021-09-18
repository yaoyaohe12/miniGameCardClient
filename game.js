import './js/libs/weapp-adapter'
import './js/msgParse'
import { lala } from './js/msgParse'

//init
var initFlag = true

//server
var serverIp = '81.68.185.7'
var serverPort = 5050 

//const canvas = wx.createCanvas()
const ctx = canvas.getContext('2d')

//屏幕
var windowHeight = wx.getSystemInfoSync().windowHeight
var windowWidth = wx.getSystemInfoSync().windowWidth

//头像
var userImageWidth = 80
var userPadding = 10

//准备
var readyTop = userImageWidth
var textHight = 20
var readyText = "准备"
var alreadyText = "已准备"

//card
var cards = []
var cardHeight = 100
var cardWidth = 80
var cardWordHeight = 20
var cardGap = 20
var selectUp = 20
var cardLineWidth = 3

//出牌按钮
var showBtnX = cardWidth
var showBtnY = windowHeight - cardHeight - 50
var showBtnWidth = 60
var showBtnHeight = 30

//进入房间按钮
var EnterBtn = new myBtn()
EnterBtn.x = windowWidth/2
EnterBtn.y = windowHeight/2
EnterBtn.words = "进入房间"

//udp
const udp = wx.createUDPSocket()
udp.bind()

//user
var myNmae = new myWords()
var myId = -1;
myNmae.x = windowWidth/2
myNmae.y = 100
myNmae.words = "游客"
myNmae.fontSize = "20pt Calibri"
var userNames = ["游客1","游客2","游客3","游客4","游客5"]

//scene
var sceneEnum = {
  lobby : 1,
  room : 2
}
var scene = sceneEnum.lobby

//msg
var msgHeadSize = 4
var msgTpye = {
  log_in : 1,
  user_info : 2 
}

function drawName()
{
  var i = 0;
  var tmp = userImageWidth
  ctx.font = "8pt Calibri"
  ctx.fillStyle = "#f15b6c"
  for(i=0;i<5;i++)
  {
    ctx.fillText(userNames[i], tmp+(userImageWidth+userPadding)*i, userImageWidth/2 + textHight)
  }
}

function drawWords(w)
{
  ctx.font = w.fontSize
  ctx.fillStyle = w.wordsColor
  ctx.fillText(w.words, w.x, w.y)
}

function drawReady(i)
{
  i++
  ctx.clearRect(i*userImageWidth, userImageWidth, userImageWidth, textHight)
  ctx.fillText(alreadyText, userImageWidth/2-10 + userImageWidth*i, userImageWidth + textHight)
}

function getCardX(i)
{
  var leftpadding = cardWidth
  return leftpadding + i*cardGap
}

function getCardY(i)
{
  if(cards[i].select == true)
  {
    return windowHeight-cardHeight-selectUp;
  }
  else
  { 
    return windowHeight-cardHeight
  }
}

function drawCard(i)
{
  ctx.lineWidth = cardLineWidth
  ctx.strokeStyle = "red"
  
  var x = getCardX(i)
  var y = getCardY(i)
  var word = cards[i].words

  ctx.fillStyle = "#2a5caa"
  ctx.fillRect(x, y, cardWidth, cardHeight)

  ctx.fillStyle = "#f15b6c"
  ctx.strokeRect(x, y, cardWidth, cardHeight)

  ctx.font = "18pt Calibri"
  ctx.fillText(word, x, y + cardWordHeight)
}

function drawCards()
{
  var i;
  var clearHeight =  cardHeight+selectUp+cardLineWidth
  ctx.clearRect(0, windowHeight-clearHeight, windowWidth, clearHeight)

  for(i=0;i<cards.length;i++)
  {
    drawCard(i)
  }
}

function drawButtonShowCard()
{
  ctx.fillStyle = "#2a5caa"
  ctx.fillRect(showBtnX, showBtnY, showBtnWidth, showBtnHeight)
  ctx.fillStyle = "#f15b6c"
  ctx.font = "18pt Calibri"
  ctx.fillText("出牌", showBtnX, showBtnY+20)
}

function isCardTouched(x,y)
{
  var i = cards.length-1

  for(;i>=0;i--)
  {
    var cardX = getCardX(i)
    var cardY = getCardY(i)
    if(x>cardX && y>cardY && x<cardX+cardWidth && y<cardY+cardHeight)
    {
      return i
    }
  }
  return -1
}

function isShowBtnTouched(x,y)
{
  if(x>showBtnX && y>showBtnY && x<showBtnX+showBtnWidth && y<showBtnY+showBtnHeight)
  {
    return true
  } 
  return false
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

function roomTouchHandler(event)
{


  var touchCard = isCardTouched(event.touches[0].clientX,event.touches[0].clientY)
  if(touchCard>=0)
  {
    cards[touchCard].select = !cards[touchCard].select;
    drawCards();
    return
  }
  var ret = isShowBtnTouched(event.touches[0].clientX,event.touches[0].clientY)
  if(ret == true)
  {
      console.log("isShowBtnTouched");
      showCard()
  }
}

function showCard()
{
  sendMsg()
  receiveMsg()
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

function initGame()
{
  WxPatch.fixScreen()
}

function startGame()
{
  var i
  for(i = 0;i<10;i++)
  {
    cards[i] = {index:i, words:i, exist:true, select:false}
  }
}

function drawUser()
{
  ctx.fillStyle = '#1aad19' // 矩形颜色
  var i = 0;
  var tmp = userImageWidth
  for(i=0;i<5;i++)
  {
    ctx.fillRect(tmp+(userImageWidth+userPadding)*i, 0, userImageWidth, userImageWidth)
  }
}


function myBtn()
{
  this.x = 0;
  this.y = 0;
  this.width = 120;
  this.height = 30
  this.words = "button"
  this.bgColor = "#2a5caa" //blue
  this.wordsColor = "#f15b6c" //red
}

function myWords()
{
  this.x = 0;
  this.y = 0;
  this.words = "words"
  this.fontSize = "8pt Calibri"
  this.wordsColor =  "#7fb80e" //green
}

function drawBtn(btn)
{
  ctx.fillStyle = btn.bgColor
  ctx.fillRect(btn.x, btn.y, btn.width, btn.height)
  ctx.fillStyle = btn.wordsColor
  ctx.font = "18pt Calibri"
  ctx.fillText(btn.words, btn.x, btn.y+btn.height)
}

function updateLobby()
{
  drawBtn(EnterBtn)
  drawWords(myNmae)
}

function updateCanvas()
{
  ctx.clearRect(0, 0, windowWidth, windowHeight)
  if(scene == sceneEnum.lobby)
  {
    updateLobby()
  }
  else
  {
    drawUser()
    drawName()
    drawCards()
    drawButtonShowCard()
  }

  //sendMsg()
}

function sendMsg(bf)
{
  console.log("sendMsg")
  udp.send({
    address: serverIp,
    port: serverPort,
    message: bf
  })
}

function copy(src, i) {
  var dst = new ArrayBuffer(src.byteLength);
  new Uint16Array(dst).set(new Uint16Array(src));
  return dst;
  }

function receiveMsg(res)
{
  console.log(res.message)
  var v1 = new Uint16Array(res.message, 0, 2);
  console.log(v1[0])
  if(v1[0] == msgTpye.log_in)
  {
    var v2 = new Uint16Array(res.message, 0, 3);
    myId = v2[2]
    console.log("receive log in id = " + myId)
    userNames[myId] = myNmae.words;
  }
  else if(v1[0] == msgTpye.user_info)
  {
    var v2 = new Uint16Array(res.message, 0, 3);
    var receiveId = v2[2]
    console.log("receive user info" + receiveId)
    userNames[receiveId] = ab2str(res.message.slice(6))
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
  console.log(bf);
  sendMsg(bf)
}

function GetUserInfo()
{
  wx.getUserInfo({
    success: function(res) {
      console.log(res.userInfo.nickName)
      myNmae.words = res.userInfo.nickName
      updateCanvas()
    },
    fail: function(res) {
    }
  })
}

function getUserAuth()
{
  const button = wx.createUserInfoButton({
    type: 'text',
    text: '获取用户信息',
    style: {
      left: 10,
      top: 76,
      width: 0,
      height: 0,
      lineHeight: 40,
      backgroundColor: '#ff0000',
      color: '#ffffff',
      textAlign: 'center',
      fontSize: 16,
      borderRadius: 4
    }
  })
  button.onTap((res) => {
    // 此处可以获取到用户信息

  })
}

console.log("start")
udp.onMessage(receiveMsg)
getUserAuth()
initGame()
canvas.addEventListener('touchstart', touchHandler)

setTimeout(() => {
  updateCanvas()
}, 1000);

wx.onShow((result) => {
  setTimeout(() => {
    updateCanvas()
  }, 1000);
})

GetUserInfo()




