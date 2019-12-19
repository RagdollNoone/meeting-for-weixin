// miniprogram/pages/newuser/newuser.js
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    focus: false,
    inputValue: '',
    openid:'',
    counterId: '',
    name: null,
    Istrue:0,
    location:'',
    Groups: {
      Id:"",
      Group:"",
    },
    Groupselected:"",
  },
  
  onLoad: function (options) {
    console.log("openid:"+app.globalData.openid)
    this.setData({
      location: options.location
    })
    console.log(options)
    if (options.location) {
      console.log("该新用户扫码进入app")
    }
    this.getgroups()
  },
  Email: function (e) {
    
    let email = e.detail.value
    let checkedNum = this.checkEmail(email)
    if (checkedNum){
      this.setData({
        inputValue: e.detail.value,
        Istrue:1
      })
    }
    else{
      this.setData({
        inputValue: e.detail.value,
        Istrue: 0
      })
    }
  },
  checkEmail: function (email) {
    let str = /^[a-zA-Z0-9_.-]+@analogic.com$/
    if (str.test(email)) {
      return true
    } else {
      return false
    }
  },
  // useradd: function (e) {
  //   if(this.data.Istrue!=0){
  //     var that=this
  //     wx.showModal({
  //       title: 'Tips',
  //       content: 'Please confirm your email\r\n' + this.data.inputValue,
  //       cancelText:'Cancel',
  //       confirmText:'Ok',
  //       success(res) {
  //         if (res.confirm) {
  //           that.newuser();
  //         } 
  //       }
  //     })
  //   }
  //   else{
  //     wx.showToast({
  //       icon: 'none',
  //       title: 'Error Email'
  //     })
  //   }
  // },
  getgroups: function () {
    wx.request({
      url: app.Host+'/meeting/groups/', //仅为示例，并非真实的接口地址
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      method: 'POST',
      success: res => {
        console.log(res)
        if (res.data.groups.length != 0) {
          var i = 0;
          for (i; i < res.data.groups.length; i++) {
            var Group = "Groups[" + i + "].Group";
            var Id = "Groups[" + i + "].Id";
            this.setData({
              [Id]: res.data.groups[i].id,
              [Group]: res.data.groups[i].group,
            });
          }
        }

      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '读取部门记录失败'
        })
      }
    })
  },
  bindinsert: function (e) {//添加会议人员
    var index = this.data.Groups[e.detail.value].Group
    console.log(index)
    this.setData({
      Groupselected: index,
    })
    if(this.data.Istrue!=0){
      var that=this
      wx.showModal({
        title: 'Tips',
        content: 'Please confirm your email\r\n' + this.data.inputValue,
        cancelText:'Cancel',
        confirmText:'Ok',
        success(res) {
          if (res.confirm) {
            that.newuser();
          } 
        }
      })
    }
    else{
      wx.showToast({
        icon: 'none',
        title: 'Error Email'
      })
    }
  },
  newuser:function(){
    wx.showLoading({
      title: 'loading...',
    })
    wx.request({
      url: app.Host+'/meeting/newUser/', //仅为示例，并非真实的接口地址
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      data: {
        'openid': app.globalData.openid,
        'email': this.data.inputValue,
        'group': this.data.Groupselected
      },
      method: 'POST',
      success: res => {
        wx.hideLoading()
        app.globalData.email = this.data.inputValue
        wx.showToast({
          title: 'OK',
        })
        if (this.data.location.length != 0) {
         this.getattend2()
        }
        wx.navigateBack({
          delta: 1
        })
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: 'ERROR'
        })
      }
    })
  },
  getattend2: function () {
    //获取具体会议记录并签到
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
        if (res.data.events.length == 0) {
          wx.showToast({
            icon: "none",
            duration: 2500,
            title: '近30分钟，您在该会议室没有会议',
          })
        }
        else {
          if (res.data.events[0].Isattend == "1") {
            wx.showToast({
              icon: "none",
              title: '该会议已签到',
            })
          }
          else {
            wx.showToast({
              icon: "",
              title: '签到成功',
            })
            this.getevent()
          }
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
})