import Main from './js/main'

//new Main()


import './js/libs/weapp-adapter'
// import './js/msgParse'

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

//showCard
var showCards = []

//出牌按钮
// var showBtnX = cardWidth
// var showBtnY = windowHeight - cardHeight - 50
// var showBtnWidth = 60
// var showBtnHeight = 30
var showBtn = new myBtn()
showBtn.x = cardWidth
showBtn.y = windowHeight - cardHeight - 50
showBtn.words = "出牌"

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
  getUserNickName: 1,
  lobby : 2,
  room : 3
}
var scene = sceneEnum.getUserNickName

//msg
var msgHeadSize = 4
var msgTpye = {
  log_in : 1,
  user_info : 2 
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

function card()
{
  this.btn = new myBtn()
  this.words = "err"
  this.select = false
  this.btn.width = cardWidth
  this.btn.height = cardHeight
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

function drawCards()
{
  var i
  for(i=0;i<cards.length;i++)
  {
    drawBtn(cards[i].btn)
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

function showCard()
{
  var i = 0;
  var j = 0;

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
  updateCanvas()
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
    showCard()
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

function initGame()
{
  WxPatch.fixScreen()
  udp.onMessage(receiveMsg)
  GetUserInfo()
  canvas.addEventListener('touchstart', touchHandler)
  initCard([1,2,3,4,6,7,8], cardWidth, windowHeight - cardHeight);
}


function initCard(arr , x , y)
{
  var i
  for(i = 0;i<arr.length;i++)
  {
    cards[i] = new card(i)
    cards[i].btn.x = x + i*cardGap;
    cards[i].btn.y = windowHeight - cardHeight;
    cards[i].btn.words = arr[i]
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
    drawName()
    drawCards()
    drawBtn(showBtn)
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

setTimeout(() => {
  updateCanvas()
}, 1000);

wx.onShow((result) => {
  setTimeout(() => {
    updateCanvas()
  }, 1000);
})






