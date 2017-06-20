var table=$("#tweets").DataTable({
    columns: [
        {data: "id"},
        {data: "screenName"},
        {data:"handle"},
        {data: "replyFound"},
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
      var value = aData.fraud;
      if (value) {
        $(nRow).addClass('invalid');
      }
      else if (value!=null) {
        $(nRow).addClass('valid');
      }
      else if (aData.attempts>=15) {
        $(nRow).addClass('toMany');
      }
    }
})
var id;
$("#tweets tbody").on("click", "tr", function (event) {
  var name=$(this).find("td:nth-child(2)").text();
  id=$(this).find("td:nth-child(1)").text();
  //window.open('https://twitter.com/'+name+'/status/'+id, '_blank');
  $.post("/getTweetInfo",{"id":id},function(data){
    if(data.replyFound){
      $("#reset").hide();
      $("#reply").show();
      $("#replyId").text("Reply From: "+data.lastReply.name);
      $("#replyText").text(data.lastReply.text);
      $("#replyText").append("<br>-@"+data.lastReply.screenName);
    }
    else{
      $("#reset").show();
      $("#reply").hide();
    }
    $("#name").text(data.name);
    $("#score").text(data.score);
    $("#text").text(data.text);
    $("#text").append("<br>-@"+data.screenName);
    $("#link").attr("href",'https://twitter.com/'+name+'/status/'+id);
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

$("#delete").click(function(){
  $.post("/deleteRecord",{"id":id});
  location.reload();
});

$("#reset").click(function(){
  $.post("/resetAttempts",{"id":id});
  location.reload();
});

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
