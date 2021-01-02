var socket = io(); // Khởi tạo socket
var controlDirPress = "";
var pressIntervalUpdate; 
var mouseIsDown = false;
var controlOnce = false;

  socket.emit("GET_MODE_STATUS","DUMMY");
  socket.emit("GET_TIME_STATUS","DUMMY");

  // Nhận các thông báo về error thông qua route "ERROR"
  socket.on("ERROR",function(error)
  { 
    console.log(error);
    alert("ERROR");
  });

  // Nhận giá trị cảm biến từ SERVER thông qua route "ENERGY-HISTORY"
  socket.on("ENERGY_DATA",function(data)
  { s
    // Kiểm tra xem có giá trị hay k
    if(data != "EMPTY_DATA")
    {
      var getValueField = Array();
      var getTimeField = Array();
  
      // Ghép data
      for(var i = 0; i < data.length; i++)
      {
        getValueField.push(data[i].value);
        getTimeField.push(data[i].time.substr(0, 5));
      }
      // Vẽ biểu đồ
      drawChart(getValueField,getTimeField,getDate);
    }
    else {
      // Vẽ biểu đồ
      drawChart(0,0,getDate);
    }
  });

  socket.on("MODE_WAS_CHANGED",function(stt)
  {
    // Một số dữ liệu dạng char sẽ được đổi về số 
    if(stt == '1')
    {
      stt = 1;
    }
    else if(stt == '0')
    {
      stt = 0;
    }
    document.getElementById('modeSlider').checked = stt;
  });

  socket.on("TIME_WAS_CHANGED",function(stt)
  {
    // Một số dữ liệu dạng char sẽ được đổi về số 
    if(stt[1] == '1')
    {
      stt[1]  = 1;
    }
    else if(stt[1]  == '0')
    {
      stt[1] = 0;
    }
    document.getElementById('timeSlider').checked = parseInt(stt[1]);
  });

  socket.on("SOLAR_STATUS_CHANGED",function(stt)
  {
    // 0 Đang cân bằng -> SF.png
    // 1 Đang left -> Nắng ở phair -> SL.png
    // 2 Đang right -> Nắng ở trasi -> SR.png
    // 3 Đang up -> Nắng ở dưới -> SU.png
    // 4 Đang down -> Nắng ở trên -> SD.png
    // 5 Đang off -> SO.png
    
    switch(parseInt(stt))
    {
      case 0: document.getElementById('solarStatus').src = "../img/SF.png"; break;
      case 1: document.getElementById('solarStatus').src = "../img/SL.png"; break;
      case 2: document.getElementById('solarStatus').src = "../img/SR.png"; break;
      case 3: document.getElementById('solarStatus').src = "../img/SU.png"; break;
      case 4: document.getElementById('solarStatus').src = "../img/SD.png"; break;
      default: break;
    }
    
  });

function sendSocketControlDir(msg)
{
  var getMode =  document.getElementById('modeSlider').checked;
  if(getMode == false)
    {
      socket.emit("CONTROL_DIRECTIONS",msg);  
    }
  console.log("You are in mode ", getMode ? "Auto" : "Manual");
}

// Hàm này điều khiển chạy mỗi khi nhấn và nhả liền
function controlDirection(dir)
{
  clearInterval(pressIntervalUpdate);
  if(controlOnce == true)
  {
    var tmp = 0;
    switch(dir)
    {
      case "left": tmp = "1l"; break;
      case "right": tmp = "2r"; break;
      case "up": tmp = "3u"; break;
      case "down": tmp = "4d"; break;
      default: break;
    }
    sendSocketControlDir(tmp); // Gửi thiết bị và giá trị trạng thái muốn điều khiển đến SERVER
  }
  else{
    controlOnce = true;
  } 
}

function modeChange()
{
  var getMode =  document.getElementById('modeSlider').checked;
  if(getMode == true)
  {
    getMode = 1;
  }
  else if(getMode == false)
  {
    getMode = 0;
  }
  socket.emit("SAVE_MODE_STATUS",getMode);
}

function timeChange()
{
  var getTime =  document.getElementById('timeSlider').checked;
  if(getTime == true)
  {
    getTime = 1;
  }
  else if(getTime == false)
  {
    getTime = 0;
  }
  socket.emit("SAVE_TIME_STATUS",getTime);
}

/***
    ###### WINDOWS EVENTS ####### 
***/

// Đóng biểu đồ khi nhấn bất cứ đâu ngoài form 
window.onclick = function(event) {
    if (event.target == document.getElementById('idHistoryChart')) 
      closeChart();
}

// Hàm hỗ trợ cho việc nhấn giữ
window.addEventListener('mousedown', function(e) {
  clearInterval(pressIntervalUpdate); // Xoá cache

  // Cờ hỗ trợ cho việc phân biệt nhấn, và nhấn giữ
  mouseIsDown = true;
  controlOnce = true;
  controlDirPress = e.target.id; // Lấy id của một đối tượng được nhấn

  var recall = function() {
    if(mouseIsDown) {
      if(controlDirPress != "" && controlOnce == true)
      {
        controlOnce = false;
        var tmp = 0;
        switch(controlDirPress)
        {
          case "left": tmp = "11"; break;
          case "right": tmp = "22"; break;
          case "up": tmp = "33"; break;
          case "down": tmp = "44"; break;
          default: break;
        }
        sendSocketControlDir(tmp); // Gửi thiết bị và giá trị trạng thái muốn điều khiển đến SERVER
      }
    }
  }
  pressIntervalUpdate = setInterval(recall, 200);
});


// Khi nhả chuột ra sẽ gọi hàm này
window.addEventListener('mouseup', function() {
  clearInterval(pressIntervalUpdate); // Xoá cache

  mouseIsDown = false;
  controlDirPress = "";
  if(controlOnce == false)
  {
    sendSocketControlDir("00");
  }  
});