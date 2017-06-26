//Get the statistics
$.get("/getStats",function(data){
  console.log(data);
  //Check the score and select the appropriate color
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
  //Set statistic values
  $("#totalAverage").text((data.averageScore).toFixed(2)).css('color', totalColor);
  $("#negativeAverage").text((data.averageNegativeScore).toFixed(2)).css('color', negativeColor);
  $("#totalCount").text(data.count);
  $("#negativeCount").text(data.negativeCount);
  //Calculate the total replies found and the percents
  var total=data.validRepliesFound+data.fraudulentRepliesFound;
  var percent=+(data.validRepliesFound/total*100).toFixed(2);
  $("#responsesFound").text("%"+(total/data.negativeCount*100).toFixed(2))
  $("#validResponses").text("%"+percent);
  $("#fraudResponses").text("%"+(100-percent).toFixed(2));
});

//Hide UAC and password modal when clicked outside of
window.onclick = function (event) {
    if (event.target == $("#generalAccount")[0] ){
        $("#generalAccount").fadeOut();
    }
    else if (event.target == $("#passwordChange")[0] ){
        $("#passwordChange").fadeOut();
    }
}

//Get user info to show in UAC panel
$("#generalUAC").click(function(){
  $.get("/getUser",function(data){
    $("#usersName").val(data.name);
    $("#uName").val(data.uname);
    $("#email").val(data.email);
    $("#generalAccount").fadeIn();
  });
});

//Show password change panel
$("#changePassword").click(function(){
  $("#passwordChange").fadeIn();
});

//Validate input from password form and post to /updatePassword
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
    $.post("/updatePassword",{currentPassword:current,newPassword:newPass});
  }
});
