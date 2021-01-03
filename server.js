var express = require("express");
var app = express();
app.use(express.static("public")); // Sử dụng folder public chứa các file của hệ thống 
app.set('view engine', 'ejs'); // Sử dụng view engine là công nghệ để hiển thị web
app.set("views","./views"); // Sử dụng folder views là nơi để chứa giao diện web

var bodyParser = require("body-parser"); // POST
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.json({ type: 'application/json' }));

var db = require("./db/db"); // Include file db.js để dùng các function truy xuất db (library tự tạo)

var server = require("http").Server(app); // Khởi tạo server HTTP
var io = require("socket.io")(server); // Khởi tạo socket
server.listen(process.env.PORT || 3000, () => { // Server sẽ chạy trên port 3000 trong hệ thống mạng
   console.log('listening on *:3000');
});

var canSaveEnergy = true;

// Hàm để lắng nghe sự kiện từ các CLIENTS
io.on("connection", function(socket)
{
  // Xuất ra terminal id của CLIENTS kết nối tới
  console.log("Client connected: " + socket.id);

  // Xuất ra terminal id của CLIENTS vừa ngắt kết nối
  socket.on("disconnect", function() {
    console.log(socket.id + " disconnected");
  });

  // Lắng nghe route "CONTROL_DIRECTIONS"
  // Hàm này gửi lệnh điều khiển cho tất cả CLIENTS
  socket.on("CONTROL_DIRECTIONS",function(dir){
      io.sockets.emit("CONTROL_DIR",dir);
      //console.log(dir);
  });

  // Lắng nghe route "SAVE_ENERGY" 
  // Hàm này lưu giá trị energy vào database đồng thời hiển thị giá trị lên các CLIENTS
  socket.on("SAVE_ENERGY", function(data) {
    console.log("data from node: ", data);
    var splitData = data.split('-');
    console.log("split: ", splitData);
    var getEnergy = splitData[0];
    var getDirStatus = splitData[1];
    console.log("split energy: ",getDirStatus);
    console.log("split dir: ",getDirStatus);

    var Vref = 4.12 // Khi chỉ cắm nguồn 12V, có thêm nguồn usb sẽ là 4.81
    var VaReality = (getEnergy * 2 * Vref)/1023; // 1023 là resolution của ADC 10 bits
    //var VaReality = ((Va * 17.6)/2); // Tỉ lệ thực tế đo được đồng hồ đo và Va
    console.log("Real: ",VaReality.toFixed(2));

    io.sockets.emit("SOLAR_STATUS_CHANGED",getDirStatus);


    var lastMin = 0;
    async function getLastMinute() {
      result = await db.queryGetLastMinute(); 
      if(result != "EMPTY_DATA")
        lastMin = result;

      var currentTime = new Date(); // for now
      var currentMin = currentTime.getMinutes();
     if(currentMin % 5 == 0)
     {
       //if(lastMin != currentMin)
       //{
          async function saveEnergy() {
            result = await db.querySaveEnergy(VaReality.toFixed(2)); 
            if(result == "querySaveEnergy-ERROR")
              console.log(result);
          }  
          if(canSaveEnergy == true)
          {
            canSaveEnergy = false;
            saveEnergy(); // Thực thi
          }
       //}
     }
     else 
      canSaveEnergy = true;
    }  
    getLastMinute(); // Thực thi
  });

// Lắng nghe route "SAVE_MODE_STATUS"
// Hàm này lưu giá trị mode vào database đồng thời thông báo đến tất cả CLIENTS để kịp thời đổi trạng thái
  socket.on("SAVE_MODE_STATUS", function(stt) {
    async function saveModeStatus() {
      result = await db.querySaveModeStatus(stt); 
      if(result != "querySaveModeStatus-ERROR")
        io.sockets.emit("MODE_WAS_CHANGED",stt);
      else console.log(result);
    }  
    saveModeStatus(); // Thực thi
  });

// Lắng nghe route "GET_MODE_STATUS"
// Hàm này lấy giá trị mode hiện tại và gửi đến client nào gọi nó
  socket.on("GET_MODE_STATUS", function(msg) {
    async function getModeStatus() {
      result = await db.queryGetModeStatus(); 
      if(result != "queryGetModeStatus-ERROR")
        socket.emit("MODE_WAS_CHANGED",result);
      else console.log(result);
    }  
    getModeStatus(); // Thực thi
  });

// Lắng nghe route "SAVE_TIME_STATUS"
// Hàm này lưu giá trị mode vào database đồng thời thông báo đến tất cả CLIENTS để kịp thời đổi trạng thái
  socket.on("SAVE_TIME_STATUS", function(stt) {
    async function saveTimeStatus() {
      result = await db.querySaveTimeStatus(stt); 
      if(result != "querySaveTimeStatus-ERROR")
        {
          stt = 't' + stt;
          io.sockets.emit("TIME_WAS_CHANGED",stt);
        }
      else console.log(result);
    }  
    saveTimeStatus(); // Thực thi
  });

// Lắng nghe route "GET_TIME_STATUS"
// Hàm này lấy giá trị mode hiện tại và gửi đến client nào gọi nó
  socket.on("GET_TIME_STATUS", function(msg) {
    async function getTimeStatus() {
      result = await db.queryGetTimeStatus(); 
      if(result != "queryGetTimeStatus-ERROR")
        {
          result = 't' + result;
          socket.emit("TIME_WAS_CHANGED",result);
        }
      else console.log(result);
    }  
    getTimeStatus(); // Thực thi
  });  

  // Lắng nghe route "GET_CHART_DATA" 
  // Hàm này truy xuất database và gửi giá trị lịch sử energy đến CLIENT đã gọi nó
  socket.on("GET_CHART_DATA", function(date) {
    async function getHistory() {
      result = await db.queryGetHistory(date); 
      if(result == "queryGetHistory-ERROR")
      {
        socket.emit("ERROR",result);
        console.log(result);
      }
      else {
        socket.emit("ENERGY_DATA",result);
      }
    }  
    getHistory(); // Thực thi
  });

  socket.on("CHECKING_LOGIN", function(data){
    if(data[0] == "solar" && data[1] == "123456")
    {
      socket.emit("OK_CREDENTIAL");
    } 
    else 
    {
      socket.emit("WRONG_CREDENTIAL");
    }
  });

});

// Khi người dùng truy cập vào url với đường link là '/' thì sẽ hiển thị giao diện trong file "dashboard.ejs" lên
app.get('/',function(req,res){
   res.render("dashboard");
});
