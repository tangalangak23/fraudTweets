var handles=[];
var managePage="";

//Initialize DataTable
var table=$("#tweets").DataTable({
    columns: [
        {data: "_id"},
        {data: "dateTime"},
        {data: "user.screenName"},
        {data:"handle"},
        {data:"responseTime"},
        {data: "score"},
        {data: "fraud"}
    ],
    "columnDefs": [
        {
          "targets": [ 3 ],
          "searchable": false
        },
        {
          "targets": [ 1 ],
          "orderable": false
        },
        {
          "targets": [ 0 ],
          "visible": false
        }
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
});

$("select").click(function() {
  if($("body").height()<$(window).height()){
    $(".footer").attr("style","position:fixed;");
  }
  else{
    $(".footer").attr("style","position:static;");
  }
});
var id;

//When a table row is clicked get the relevant info and display it in the modals
$("#tweets tbody").on("click", "tr", function (event) {
  var name=table.row(this).data().screenName;
  id=table.row(this).data()._id;
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

//Get the search terms and generate the input fields
function getManagment(){
  handles=[];
  $.get("/get"+managePage,function(data){
    $("#handlesContainter").html("");
    if(managePage=="Terms"){
      for(i=0;i<data.length;i++){
        handles.push(data[i].handle);
      }
    }
    else{
      handles=data.value;
    }
    for(i=0;i<handles.length;i++){
      temp="<tr><td><input type='text' class='form-control manage' data-new='no' value='"+handles[i]+"'></td><td><input class='form-control manage' type='checkbox' id='"+i+"'></td></tr>";
      $("#handlesContainter").append(temp);
    }
  });
}

//Handle creating a new input field for additional terms
$("#add").click(function(){
  temp="<tr><td><input type='text' data-new='yes' class='form-control manage'></td><td><input class='form-control manage' type='checkbox' value='new'></td></tr>";
  $("#handlesContainter").append(temp);
});

//Handle the update by creating a new list of search terms and posting to /updateTerms
$("#update").click(function(){
  $(".manage").each(function(data,obj){
    console.log(data);
    type=$(obj).attr("type");
    newHandle=$(obj).attr("data-new");
    val=$(obj).val();
    if(type=="text"){
      if(newHandle=='no'){
        temp="#"+(data/2).toString();
        if($(temp).is(":checked")){
          if(managePage=="Terms"){
            handles[data/2]="";
          }
          else{
            handles.splice((data/2),1);
          }
        }
        else{
          handles[data/2]=val;
        }
      }
      else if(val!="" && handles.indexOf(val)==-1){
        handles.push(val)
      }
    }
  });
  if(managePage=="Terms"){
    for(i=0;i<handles.length;i++){
      if(handles[i]==""){
        handles.pop(i)
      }
    }
  }
  console.log(handles);
  $.post("/update"+managePage,{"newValues":handles});
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
function updateFooter(){
  if($("body").height()<$(window).height()){
    $(".footer").attr("style","position:fixed;");
  }
  else{
    $(".footer").attr("style","position:static;");
  }
}
$(window).resize(function() {
  updateFooter();
});

var routes = Backbone.Router.extend({
  routes: {
    '': 'home',
    "statistics": "stats",
    "verifiedHandles": "handles",
    'searchTerms': 'terms'
  },
  home: function(){
    $("#tweets").attr("style","");
    $("#dashboard").show();
    $("#homeLink").addClass("current");
    $("#statistics").hide();
    $("#statsLink").removeClass("current");
    $("#handle").hide();
    $("#handleLink").removeClass("current");
    $("#termLink").removeClass("current");
    updateFooter();
  },
  stats: function(){
    $.get("/getStats",function(data){
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
      $("#responseTime").text((data.averageResponseTime).toFixed(2)+" min.");
    });
    $("#dashboard").hide();
    $("#homeLink").removeClass("current");
    $("#statistics").show();
    $("#statsLink").addClass("current");
    $("#handle").hide();
    $("#handleLink").removeClass("current");
    $("#termLink").removeClass("current");
    updateFooter();
  },
  handles: function(){
    $("#manageH1").text("Manage the verified handles below");
    $("#manageH3").text("A verified handle is a handle that will not flag as fraud when they reply offering help.");
    $("#dashboard").hide();
    $("#homeLink").removeClass("current");
    $("#statistics").hide();
    $("#statsLink").removeClass("current");
    $("#handle").show();
    $("#handleLink").addClass("current");
    $("#termLink").removeClass("current");
    managePage="Handles";
    getManagment();
    updateFooter();
  },
  terms: function(){
    $("#manageH1").text("Manage the search terms below");
    $("#manageH3").text("Search terms can either be @term or #term");
    $("#dashboard").hide();
    $("#homeLink").removeClass("current");
    $("#statistics").hide();
    $("#statsLink").removeClass("current");
    $("#handle").show();
    $("#handleLink").removeClass("current");
    $("#termLink").addClass("current");
    managePage="Terms";
    getManagment();
    updateFooter();
  }
});
var appRoutes = new routes();
Backbone.history.start();
