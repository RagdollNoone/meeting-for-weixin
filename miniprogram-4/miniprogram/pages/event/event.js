// miniprogram/pages/event/event.js
const app = getApp()
Page({
  data: {
    eventid:"",
    Attendees:[{
      Attendid:"",
      Name:"",
      Address:"",
      Isattend:"",
      Attendtime:""
    }],
    Events:{
      Subject:"",
      Start:"",
      Organizer:"",
      Location:"",
      Proportion: "",
      Truenum:"",
      Falsenum:"",
      Latenum:"",
      Total:""
    },
    len:0,
    isorganizer:false,
    windowWidth:180,
    windowHeight:600,
    groups: [{
      Groupid: "",
      name: "",
      Userlist: [{
        Userid: "",
        name: ""
      }],
    }],
    index: 0,
    objectgroups: [
      [{
      }],
      [{
      }]
    ],
    multiIndex: [0, 0],
  },
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading() //在标题栏中显示加载
    this.getevent();
    setTimeout(function () {
      wx.hideNavigationBarLoading() //完成停止加载
      wx.stopPullDownRefresh() //停止下拉刷新
    }, 1500);
  },
  onLoad: function (options) {
    this.setData({
      eventid:options.eventid
    })
    console.log(options)
    if(options.eventid){
    }
    wx.getSystemInfo({
      success: res=> {
        this.setData({
          windowWidth: res.windowWidth/2,
          windowHeight: res.windowHeight
        })
        console.log(this.data.windowWidth)
      },
    })
  },
  onShow: function () {
    this.getevent();
    this.getusers();
  },
  getevent:function(){
    //获取当天会议记录
    wx.request({
      url: app.Host+'/meeting/detail/', //仅为示例，并非真实的接口地址
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      data: {
        'Eventid': this.data.eventid,
      },
      //method: 'GET',
      success: res => {
        this.setData({
          Attendees: [{
            Attendid: "",
            Name: "",
            Address: "",
            Isattend: "",
            Attendtime: ""
          }],
        })
        console.log(res)
        if (res.data.Events.Organizeraddress == app.globalData.email){
          this.setData({
            isorganizer:true,
          })
        }
        var Subject = "Events.Subject";
        var Location = "Events.Location";
        var Start = "Events.Start";
        var Organizer = "Events.Organizer";
        var Truenum = "Events.Truenum";
        var Latenum = "Events.Latenum";
        var Proportion = "Events.Proportion";
        var Falsenum = "Events.Falsenum";
        var Total = "Events.Total";
        this.setData({
          len: res.data.Attendees.length,
          [Subject]: res.data.Events.Subject,
          [Location]: res.data.Events.Location,
          [Start]: res.data.Events.Start,
          [Organizer]: res.data.Events.Organizer,
          [Truenum]: res.data.Events.Truenum,
          [Latenum]: res.data.Events.Latenum,
          [Proportion]: res.data.Events.Proportion,
          [Falsenum]: res.data.Events.Falsenum,
          [Total]: res.data.Events.Total,
        })
        //console.log(this.data.Events)
        if (this.data.len != 0) {
          var i = 0;
          for (i; i < this.data.len; i++) {
            var Attendid = "Attendees[" + i + "].Attendid";
            var Name = "Attendees[" + i + "].Name";
            var Address = "Attendees[" + i + "].Address";
            var Isattend = "Attendees[" + i + "].Isattend";
            var Attendtime = "Attendees[" + i + "].Attendtime";
            this.setData({
              [Attendid]: res.data.Attendees[i].Id,
              [Name]: res.data.Attendees[i].Name,
              [Address]: res.data.Attendees[i].Address,
              [Isattend]: res.data.Attendees[i].Isattend,
              [Attendtime]: res.data.Attendees[i].Attendtime, //用[]表示的变量    
            });
            //console.log(this.data.Attendees[i], "Attendees[" + i + "]");
          }
          //console.log(this.data.Attendees)
        }
        
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '读取会议记录失败'
        })
      }
    })
  },
  getusers:function(){
    wx.request({
      url: app.Host+'/meeting/users/', //仅为示例，并非真实的接口地址
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      method: 'POST',
      success: res => {
        console.log(res)
        if (res.data.groups.length != 0) {
          this.setData({
            groups: res.data.groups,
            objectgroups: res.data.objectgroups
          })
        }
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '读取用户记录失败'
        })
      }
    })
  },
  binddelete: function (e) {//移除会议人员
    wx.showLoading({
      title: 'loading...',
    })
    var index=this.data.Attendees[e.detail.value].Attendid
    if (this.data.Attendees[e.detail.value].Address == app.globalData.email)
    {
      wx.showToast({
        icon: 'none',
        title: '请不要移除你自己'
      })
    }
    else{
      wx.request({
        url: app.Host+'/meeting/refuse/', //仅为示例，并非真实的接口地址
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 默认值
        },
        data: {
          'Attendid': index,
        },
        //method: 'GET',
        success: res => {
          this.getevent();
          wx.hideLoading()
          wx.showToast({
            title: 'OK',
          })
        },
        fail: err => {
          wx.hideLoading()
          wx.showToast({
            icon: 'none',
            title: '拒绝会议失败'
          })
        }
      })
    }
  },
  bindinsert: function (e) {//添加会议人员
    var index2 = this.data.eventid
    if (this.data.groups[e.detail.value[0]]['Userlist'].length != 0) {
      var index = this.data.groups[e.detail.value[0]]['Userlist'][e.detail.value[1]]['Userid']
      wx.request({
        url: app.Host+'/meeting/insert/', //仅为示例，并非真实的接口地址
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 默认值
        },
        data: {
          'Eventid': index2,
          'Userid': index
        },
        //method: 'GET',
        success: res => {
          wx.hideLoading()
          if (res.data == "existed") {
            wx.showToast({
              icon: 'none',
              title: '我已经在列表中了',
            })
          }
          if (res.data == "insert") {
            this.getevent();
            wx.showToast({
              icon: 'none',
              title: '一会就来',
            })
          }
        },
        fail: err => {
          wx.hideLoading()
          wx.showToast({
            icon: 'none',
            title: '添加会议失败'
          })
        }
      })
    }
    else {
      wx.showToast({
        icon: 'none',
        title: '请选择正确的与会人员'
      })
    }
    this.setData({
      multiIndex: e.detail.value
    })

  },
  bindMultiPickerColumnChange: function (e) {//多列选择器
    console.log('修改的列为', e.detail.column, '，值为', e.detail.value);
    var data = {
      multiIndex: this.data.multiIndex,
      objectgroups: this.data.objectgroups,
      groups: this.data.groups
    };
    data.multiIndex[e.detail.column] = e.detail.value;
    switch (e.detail.column) {
      case 0:
        switch (data.multiIndex[0]) {
          case 0:
            data.objectgroups[1] = data.groups[0]['Userlist'];
            break;
          case 1:
            data.objectgroups[1] = data.groups[1]['Userlist'];
            break;
          case 2:
            data.objectgroups[1] = data.groups[2]['Userlist'];
            break;
          case 3:
            data.objectgroups[1] = data.groups[3]['Userlist'];
            break;
          case 4:
            data.objectgroups[1] = data.groups[4]['Userlist'];
            break;
          case 5:
            data.objectgroups[1] = data.groups[5]['Userlist'];
            break;
          case 6:
            data.objectgroups[1] = data.groups[6]['Userlist'];
            break;
          case 7:
            data.objectgroups[1] = data.groups[7]['Userlist'];
            break;
          case 8:
            data.objectgroups[1] = data.groups[8]['Userlist'];
            break;
          case 9:
            data.objectgroups[1] = data.groups[9]['Userlist'];
            break;
          case 10:
            data.objectgroups[1] = data.groups[10]['Userlist'];
            break;
          case 11:
            data.objectgroups[1] = data.groups[11]['Userlist'];
            break;
          case 12:
            data.objectgroups[1] = data.groups[12]['Userlist'];
            break;
          case 13:
            data.objectgroups[1] = data.groups[13]['Userlist'];
            break;
        }
        data.multiIndex[1] = 0;
        data.multiIndex[2] = 0;
        break;
    }
    console.log(data.multiIndex);
    this.setData(data);
  },
})