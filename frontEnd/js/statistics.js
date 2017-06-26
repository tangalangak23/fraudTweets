$.get("/getStats",function(data){
  if(data.averageScore>=2){
    totalColor="#43A047";
  }
  else if(data.averageScore>=0){
    totalColor="#1E88E5";
  }
  else if(data.averageScore>=-2){
    totalColor="#FDD835";
  }
  else{
    totalColor="#E53935";
  }
  if(data.averageNegativeScore>=2){
    negativeColor="#43A047";
  }
  else if(data.averageNegativeScore>=0){
    negativeColor="#1E88E5";
  }
  else if(data.averageNegativeScore>=-2){
    negativeColor="#FDD835";
  }
  else{
    negativeColor="#E53935";
  }
  $("#totalAverage").text((data.averageScore).toFixed(2)).css('color', totalColor);
  $("#negativeAverage").text((data.averageNegativeScore).toFixed(2)).css('color', negativeColor);
  $("#totalCount").text(data.count);
  $("#negativeCount").text(data.negativeCount);
  var total=data.validRepliesFound+data.fraudulentRepliesFound;
  var percent=+(data.validRepliesFound/total*100).toFixed(2);
  $("#responsesFound").text("%"+(total/data.negativeCount*100).toFixed(2))
  $("#validResponses").text("%"+percent);
  $("#fraudResponses").text("%"+(100-percent).toFixed(2));
});
window.onclick = function (event) {
    if (event.target == $("#generalAccount")[0] ){
        $("#generalAccount").fadeOut();
    }
    else if (event.target == $("#passwordChange")[0] ){
        $("#passwordChange").fadeOut();
    }
}

$("#generalUAC").click(function(){
  $.get("/getUser",function(data){
    $("#usersName").val(data.name);
    $("#uName").val(data.uname);
    $("#email").val(data.email);
    $("#generalAccount").fadeIn();
  });
});

$("#changePassword").click(function(){
  $("#passwordChange").fadeIn();
});

$('#passwordForm').click(function(ev) {
  current=$("#current").val();
  newPass=$("#newPass").val();
  newPass2=$("#newPass2").val();
  console.log(current+newPass)
  if(current==newPass){
    $("#message").text("New password Matches old password");
  }
  else if(newPass!=newPass2){
    $("#message").text("New passwords do not match");
  }
  else{
    $("#message").text("Updating Password");
    $.post("/updatePassword",{currentPassword:current,newPassword:newPass},function(data){

    });
  }
});
