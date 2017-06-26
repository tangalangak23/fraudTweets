//Initialize DataTable
var table=$("#tweets").DataTable({
    columns: [
        {data: "_id"},
        {data: "user.screenName"},
        {data:"handle"},
        {data:"responseTime"},
        {data: "score"},
        {data: "fraud"}
    ],
    "order": [[ 0, "desc" ]],
    "searching": true,
    ajax: {
        url: "/getTweets",
        dataSrc: "",
        type: "GET",
    },
    "fnCreatedRow": function (nRow, aData, iDisplayIndex) {
      //When a row is created check the fraud score and color appropriately
      var value = aData.fraud;
      if (value=="%0") {
        $(nRow).addClass('valid');
      }
      else if (value=="%30") {
        $(nRow).addClass('verified');
      }
      else if (value!=null) {
        $(nRow).addClass('invalid');
      }
      else if (aData.attempts>=30) {
        $(nRow).addClass('toMany');
      }
    }
})
var id;

//When a table row is clicked get the relevant info and display it in the modals
$("#tweets tbody").on("click", "tr", function (event) {
  var name=$(this).find("td:nth-child(2)").text();
  id=$(this).find("td:nth-child(1)").text();
  $.post("/getTweetInfo",{"id":id},function(data){
    if(data.replyFound){
      $("#reset").hide();
      $("#reply").show();
      $("#replyId").text("Reply From: "+data.lastReply.name);
      $("#replyText").text(data.lastReply.text);
      $("#replyText").append("<br>-@"+data.lastReply.screenName);
      $("#replyText").append("<br>"+data.lastReply.dateTime);
    }
    else{
      $("#reset").show();
      $("#reply").hide();
    }
    $("#background").attr("style",("background-image:url('"+data.user.coverIMG+"')"));
    $("#profilePic").attr("src",data.user.profileIMG);
    $("#name").text(data.user.name);
    $("#screenName").text(data.user.screenName);
    $("#location").text(data.user.location);
    $("#lang").text(data.user.lang);
    $("#zone").text(data.user.timeZone);
    $("#follow").text(data.user.followerCount);
    $("#friends").text(data.user.friendCount);
    $("#statuses").text(data.user.statusCount);
    $("#creation").text(data.user.created);
    $("#averageScore").text(data.user.averageScore);
    $("#score").text(data.score);
    $("#text").text(data.text);
    $("#text").append("<br>-@"+data.user.screenName);
    $("#text").append("<br>"+data.dateTime);
    $("#link").attr("href",'https://twitter.com/'+name+'/status/'+id);
    $("#profileLink").attr("href",'https://twitter.com/'+name);
    $("#detailedView").fadeIn();
  });
});

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == $("#detailedView")[0] ){
        $("#detailedView").fadeOut();
    }
    else if (event.target == $("#generalAccount")[0] ){
        $("#generalAccount").fadeOut();
    }
    else if (event.target == $("#passwordChange")[0] ){
        $("#passwordChange").fadeOut();
    }
}

//Delete the record from the db
$("#delete").click(function(){
  $.post("/deleteRecord",{"id":id});
  location.reload();
});

//Reset the attempted searches
$("#reset").click(function(){
  $.post("/resetAttempts",{"id":id});
  location.reload();
});

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
