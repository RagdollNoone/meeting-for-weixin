const formatTime = date => {
  var date1 = new Date(date);
  const year = date1.getFullYear()
  const month = date1.getMonth() + 1
  const day = date1.getDate()
  const hour = date1.getHours()
  const minute = date1.getMinutes()
  const second = date1.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
  //return [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

module.exports = {
  formatTime: formatTime
}