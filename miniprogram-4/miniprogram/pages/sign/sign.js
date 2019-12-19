// pages/sign/sign.js
const app = getApp()
const util = require('../../utils/util.js')
const util2 = require('../../utils/util2.js')
const util3 = require('../../utils/util3.js')
// 引入coolsite360交互配置设定
require('coolsite.config.js');
Page({

  data: {
    array: [{
      Id: "",
      Subject: "",
      Isarray:""
    }],
    openid: '',
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    motto:'',
    email:'',
    createTime:'',
    len: 0,
    logs: [{
      Attendid:"",
      Eventid:"",
      Subject: "",
      Start: "",
      End: "",
      Location: "",
      Isattend:"",
      Attendtime:""
    }],
    isempty: false,
    hasUserInfo: false,
    isarray:false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    date:'',
    time:"",
    today:"",
    location:'',
  },

  onLoad: function (options) {
    app.coolsite360.register(this);
    var id = options["meetingid"]
    console.log(options)
    if (options.meetingid){
      this.setData({
        location: options.meetingid
      })
    }
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })
  },
  // //再次回到这个界面
   onShow: function () {
     app.coolsite360.onShow(this);
     this.setData({
       email: app.globalData.email
     })
     wx.cloud.callFunction({
       name: 'login',
       data: {},
       success: res => {
         console.log('[云函数] [login] user openid: ', res.result.openid)
         app.globalData.openid = res.result.openid
         var that = this
         that.setData({
           openid: res.result.openid
         })
         //获取用户的邮箱
         wx.request({
           url: app.Host+'/meeting/isnewUser/', //仅为示例，并非真实的接口地址
           header: {
             'content-type': 'application/x-www-form-urlencoded' // 默认值
           },
           data: {
             'openid': app.globalData.openid,
           },
           method: 'POST',
           success: res => {
             //console.log(res)
             if (res.data == 0) {
               if (this.data.location.length != 0) {
                 wx.navigateTo({
                   url: "../newuser/newuser?location=" + this.data.location
                 })
               }
               else {
                 wx.navigateTo({
                   url: '../newuser/newuser?location'
                 })
               }
             }
             else {
               app.globalData.email = res.data
               this.setData({
                 email: res.data
               })
               //获取当天会议记录
               this.getevent()
               //根据用户扫描的二维码信息完成签到
               if (this.data.location.length != 0) {
                 console.log(this.data.location.length)
                 this.getattend2()
               }
               if (this.data.email.length != 0) {
                 console.log(this.data.email)
               }
             }
           },
           fail: err => {
             wx.showToast({
               icon: 'none',
               title: '读取用户邮箱失败'
             })
           }
         })
       },
       fail: err => {
         console.error('[云函数] [login] 调用失败', err)
         wx.navigateTo({
           url: '../deployFunctions/deployFunctions',
         })
         wx.showToast({
           icon: 'none',
           title: '云函数调用失败'
         })
       }
     })
  },

//点击签到
  attend: function (e) {
    var tmp = undefined;
    if (typeof (this.data.email) == "undefined") {
      if (this.data.location.length != 0) {
        wx.navigateTo({
          url: "../newuser/newuser?location=" + this.data.location
        })
      }
      else {
        wx.navigateTo({
          url: '../newuser/newuser'
        })
      }
    }
    else{
      console.log(this.data.email)
      if(this.data.len=="0"){
        wx.showToast({
          duration: 2000,
          title: '今天没有会议 '
        })
      }
      else{
        if(this.data.isarray==false){
          wx.showToast({
            duration: 2000,
            title: "今天会议已完成 "
          })
        }
        else{
          var that = this;
          wx.scanCode({
            onlyFromCamera: true,
            success(res) {
              console.log(res)
              if (res.path) {//合法本小程序路径
                var str = res.path
                var index = str.indexOf("=");//截取=符号后面的字符串
                var scene = str.substr(index + 1, str.length); //获得=符号后面所有字符
                console.log(scene)
                that.setData({
                  location: scene
                })
                that.getattend2()
              }
            }
          })
        }
      }
    }
  },
  //会议选择
  bindPickerChange: function (e) {
    //console.log('签到编号：', this.data.array[e.detail.value].Id)
    wx.request({
      url: app.Host+'/meeting/attend/', //仅为示例，并非真实的接口地址
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      data: {
        'Attendid': this.data.array[e.detail.value].Id,
      },
      method: 'POST',
      success: res => {
        //获取当天会议记录
        this.getevent()
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: 'fail attend'
        })
      }
    })
  },
  //获取用户信息
  getUserInfo: function (e) {
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
    wx.showLoading({
      title: 'loading...',
    })
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        wx.hideLoading()
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        //获取用户的邮箱
        wx.request({
          url: app.Host+'/meeting/isnewUser/', //仅为示例，并非真实的接口地址
          header: {
            'content-type': 'application/x-www-form-urlencoded' // 默认值
          },
          data: {
            'openid': app.globalData.openid,
          },
          method: 'POST',
          success: res => {
            if (res.data == 0) {
              if (this.data.location.length != 0) {
                wx.navigateTo({
                  url: "../newuser/newuser?location=" + this.data.location
                })
              }
              else{
                wx.navigateTo({
                  url: '../newuser/newuser'
                })
              }
            }
            else {
              app.globalData.email = res.data
              this.setData({
                email: res.data
              })
              //获取当天会议记录
              this.getevent()
            }
          },
          fail: err => {
            wx.showToast({
              icon: 'none',
              title: 'Email error'
            })
          }
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
    
    //console.log("email:" + app.globalData.email)
  },
  getattend2: function () {
    //获取具体会议记录
    wx.request({
      url: app.Host+'/meeting/attend2/', //仅为示例，并非真实的接口地址
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      data: {
        'email': app.globalData.email,
        'location': this.data.location,
      },
      //method: 'GET',
      success: res => {
        console.log(res)
        if(res.data.events.length==0){
          wx.showToast({
            icon:"none",
            duration: 2500,
            title: '近30分钟，您在该会议室没有会议',
          })
        }
        else{
          this.setData({
            location:''
          })
          if (res.data.events[0].Istrue == "1" ){
            wx.showToast({
              icon: "none",
              title: '不需要重复签到哦',
            })
          }
          else if (res.data.events[0].Istrue == "0"){
            if(res.data.events[0].Isattend=="1"){
              wx.showToast({
                icon: "",
                title: '您非常准时！',
              })
            }
            else if (res.data.events[0].Isattend == "2"){
              wx.showToast({
                icon: "none",
                duration: 2800,
                title: '时间一分，贵如千金\r\n'+'下次记得早点来哦！',
              })
            }
            this.getevent()
          }
        }
        //this.getevent()
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: 'Events error'
        })
      }
    })
  },
  getevent:function(){
    //获取当天会议记录
    wx.request({
      url: app.Host+'/meeting/events/', //仅为示例，并非真实的接口地址
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      data: {
        'email': app.globalData.email,
      },
      //method: 'GET',
      success: res => {
        //console.log(res)
        this.setData({
          len: res.data.events.length,
          array: [{
            Id: "",
            Subject: "",
          }],
          isarray: false,
          logs: [{
            Attendid: "",
            Eventid: "",
            Subject: "",
            Start: "",
            End: "",
            Location: "",
            Isattend: "",
            Attendtime: ""
          }],
        })
        if (this.data.len != 0) {
          this.setData({
            isempty: true
          })
          var i = 0;
          for (i; i < this.data.len; i++) {
            var Attendid = "logs[" + i + "].Attendid";
            var Eventid = "logs[" + i + "].Eventid";
            var index = "logs[" + i + "].Subject";
            var index1 = "logs[" + i + "].Start";
            var index2 = "logs[" + i + "].Location";
            var End = "logs[" + i + "].End";
            var Isattend = "logs[" + i + "].Isattend";
            var Attendtime = "logs[" + i + "].Attendtime";
            var Id = "array[" + i + "].Id"
            var Subject = "array[" + i + "].Subject"
            var Isarray="array["+i+"].Isarray"
            //console.log(res.data.events[i])
            //console.log(type(res.data.events[i].Isarray))
            this.setData({
              [Attendid]: res.data.events[i].Attendid,
              [Eventid]: res.data.events[i].Eventid,
              [index]: res.data.events[i].Subject,
              [index1]: res.data.events[i].Start,
              [index2]: res.data.events[i].Location,
              [End]: res.data.events[i].End,
              [Isattend]: res.data.events[i].Isattend,
              [Attendtime]: res.data.events[i].Attendtime, //用[]表示的变量    
              [Id]: res.data.events[i].Attendid,
              [Subject]: res.data.events[i].Subject,
              [Isarray]: res.data.events[i].Isattend,
            });
          }
          this.remove();
        }

      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: 'Events error'
        })
      }
    })
  },
  remove:function(){
    var arr=this.data.array
    for (var i = 0; i < arr.length;i++){
      if(arr[i].Isarray!='0'){
        arr.splice(i--,1)
      }
    }
    if(arr.length>'0'){
      this.setData({
           isarray: true
         })
    }
    this.setData({
      array:arr
    })
  },
  getemail:function(e){
    //获取用户的邮箱
    wx.request({
      url: app.Host+'/meeting/isnewUser/', //仅为示例，并非真实的接口地址
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      data: {
        'openid': app.globalData.openid,
      },
      method: 'POST',
      success: res => {
        if (res.data == 0) {
        }
        else {
          app.globalData.email = res.data
          this.setData({
            email: res.data
          })
          //获取当天会议记录
          this.getevent()
        }
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: 'Email Error'
        })
      }
    })
  },
  details:function(e){
    console.log(e.currentTarget.dataset.eventid)
    var i = e.currentTarget.dataset.eventid
    wx.navigateTo({
      url: "../event/event?eventid="+i,
    })
  },
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading() //在标题栏中显示加载
    this.getemail();
    setTimeout(function () {
      wx.hideNavigationBarLoading() //完成停止加载
      wx.stopPullDownRefresh() //停止下拉刷新
    }, 1500);
  },
})