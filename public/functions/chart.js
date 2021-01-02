var chartIntervalUpdate;
var getDate = "";
var Draw;

// Hàm lấy ngày hôm nay và ép về kiểu như trong database để dễ xử lý
function getToday() {
  var today = new Date();    // Lấy date theo định dặng mặc định nào đó
  var dd = today.getDate();    // Tách ngày
  var mm = today.getMonth() + 1; // Tách tháng nhưng phải +1 vì January trả về 0
  var yyyy = today.getFullYear();// Lấy năm 4 chữ số  
  
  if (dd <  10)  // Thêm số 0 cho ngày < 10
   dd = '0' + dd
  if (mm <  10)  // Thêm số 0 cho tháng < 10
   mm = '0' + mm  
  
  return yyyy + '-' + mm + '-' + dd;
}

// var Quantity = 0;

// // Khi ấn nút Get , sẽ vào đây và lấy giá trị trong ô nhập ra
// function Change_Quantity()
// { 
//   var Tmp_Quantity = document.getElementById("GetQuantityBtn").value;
//   if(Tmp_Quantity > 50) // Nếu nhập lớn hơn 50 giá trị hiển thị thì sẽ bị rối mắt nên là báo nhập lại
//   {
//     document.getElementById("GetQuantityBtn").value=0; //update lại giá trị 0 cho cái ô input
//     alert("The Quantity Should Be Lower Than 50");
//   }
//   else  // Còn k thì hiển thị ra và update lại giá trị 0 cho cái ô input
//   {
//     Quantity = document.getElementById("GetQuantityBtn").value;
//     document.getElementById("GetQuantityBtn").value=0;  
//   }
  
// }

// Hàm vẽ với 3 tham số Value, Time và Ngày
function drawChart(Value, Time, DateTitle) {
  var ctx = document.getElementById('myChart').getContext('2d');
 
  if (typeof Draw != 'undefined') {
   Draw.destroy(); // Xoá cache chart cũ
  }
  
  Chart.defaults.global.defaultFontFamily = 'Lato';  // Set font chữ cho toàn chart
  Chart.defaults.global.defaultFontSize = 11;    // Size chữ
  Chart.defaults.global.defaultFontColor = '#111'; // Màu chữ
  
  Draw = new Chart(ctx, {
    type: 'line', //Loại biểu đồ đường
    data: {
  
      // Labels này là tên trục X 
      labels: Time,  // Mảng các thời gian tương ứng với giá trị điện thu được
  
      datasets: [{
        showLine: true,
        label: 'Value', // Đơn vị của myData , khi trỏ vào điểm tròn sẽ hiển thị
        yAxisID: 'Rate', // ID của trục Y
        xAxisID: 'Date', // ID của trục X
    
        data: Value,  // Mảng data với các giá trị điện thu được
     
        pointBackgroundColor: 'rgba(150, 102, 255, 0.6)', // Màu
        pointBorderWidth: 2,    // Viền
        pointBorderColor: '#777', // Màu viền
        pointHoverBorderWidth: 2, // Viền Animation
        pointHoverBorderColor: '#000',  // Màu viền animation
        pointRadius: 3,       // Độ to của điểm tròn
        backgroundColor: 'white'
      }]
   },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0   // Animation của chart , nên set về 0
      },
      title: {     // Tiêu đề
        display: true,
        text: "Ngày: "+DateTitle, // Hiển thị ngày 
        fontSize: 25 // font
      },
      legend:{   // Chú thích giá trị, k nên hiển thị
        display:false,
      },
      scales: { // Đặt tên, set min max cho các trục X Y
        yAxes: [{
          id: 'Rate',
          position: 'left',
          scaleLabel: {
            display: true,
            labelString: 'Rate(mA)',  
            fontSize: 25
          },
          ticks: {
            min: 0,
            max: 100,
            stepSize: 10
          }
        }],

        xAxes: [{
          id: 'Date',
          position: 'bottom',
          scaleLabel: {
            display: true,
            labelString: 'Time',
            fontSize: 25
          }
        }]
      },
    }
  });
}

// Hiển thị biểu đồ trong ngày
function showChart() {
  document.getElementById('idHistoryChart').style.display='block'; // Hiển thị
  document.getElementById("idDateSelection").value = null; // Reset lịch
  clearInterval(chartIntervalUpdate);// Xoá cache 

  getDate = getToday();
  var recall = function() {
    socket.emit("GET_CHART_DATA",getDate);
  }
  chartIntervalUpdate = setInterval(recall, 1000);
}

// Hiện thị biểu đồ lịch sử
function showHistory() 
{
  clearInterval(chartIntervalUpdate);

  getDate = getToday();
  var getInputDate = document.getElementById("idDateSelection").value; // Lấy input
  if(getInputDate){
    if(getInputDate == getDate)
      showChart();
    else
    {
      getDate = getInputDate;
      socket.emit("GET_CHART_DATA",getDate); // Gửi đến server để yêu cầu dữ liệu ứng với ngày input
    }
  }
}

// Đóng biểu đồ
function closeChart(){
  clearInterval(chartIntervalUpdate);// Xoá cache 
  document.getElementById('idHistoryChart').style.display = "none"; // Đóng biểu đồ
}