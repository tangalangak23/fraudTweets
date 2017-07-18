var searchesItem=[];
var id;
var searchName;
var currentSearch;
setTimeout(updateFooter,250);
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
//When a table row is clicked get the relevant info and display it in the modals
$("#tweets tbody").on("click", "tr", function (event) {
  var name=table.row(this).data().user.screenName;
  id=table.row(this).data()._id;
  searchName=table.row(this).data().searchName;
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
//Delete the record from the db
$("#delete").click(function(){
  $.post("/deleteRecord",{"id":id,"name":searchName});
  location.reload();
});
//Reset the attempted searches
$("#reset").click(function(){
  $.post("/resetAttempts",{"id":id});
  location.reload();
});

//Modal code
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
    else if (event.target == $("#newSearch")[0] ){
        $("#newSearch").fadeOut();
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
$("#newSearchbtn").click(function(){
  $("#newSearch").fadeIn();
});
//Validate input from password form and post to /updatePassword
$('#passwordForm').click(function(ev) {
  current=$("#current").val();
  newPass=$("#newPass").val();
  newPass2=$("#newPass2").val();
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


//Footer code
function updateFooter(){
  if($("body").height()<$(window).height()-20){
    $(".footer").attr("style","position:fixed;");
  }
  else{
    $(".footer").attr("style","position:static;");
  }
}

$("select").change(function() {
  updateFooter();
});
$(".btn").click(function() {
  updateFooter()
});

$(window).resize(function() {
  updateFooter();
});

//Managment page code
$("#searchSelector").change(function(data){
  $("#managmentContent").fadeOut(250);
  $("#searchTerms").html("");
  $("#verifiedHandles").html("");
  currentSearch=$(this).val();
  for(i=0;i<searchesItem.length;i++){
    if(currentSearch==searchesItem[i].name){
      terms=searchesItem[i].terms;
      handles=searchesItem[i].verified;
      for(j=0;j<terms.length;j++){
        $("#searchTerms").append("<tr><td>"+terms[j]+"</td><td><input type=checkbox class='form-control terms'></td></tr>");
      }
      for(j=0;j<handles.length;j++){
        $("#verifiedHandles").append("<tr><td>"+handles[j]+"</td><td><input type=checkbox class='form-control handles'></td></tr>");
      }
      $("#managmentContent").fadeIn(250);
      break;
    }
  }
  updateFooter();
});

function updateSearches(){
  for(i=0;i<searchesItem.length;i++){
    if(currentSearch==searchesItem[i].name){
      deleteTerms=[]
      $(".terms").each(function(data){
        if($(this).is(":checked")){
          deleteTerms.push(data);
        }
      });
      newTerms=[]
      $(".newTerm").each(function(data){
        newTerms.push($(this).val());
      });

      deleteHandles=[];
      $(".handles").each(function(data){
        if($(this).is(":checked")){
          deleteHandles.push(data);
        }
      });
      newHandles=[]
      $(".newHandle").each(function(data){
        newHandles.push($(this).val());
      });
      var postData={
        "deleteTerms":deleteTerms.reverse(),
        "newTerms":newTerms,
        "deleteHandles":deleteHandles.reverse(),
        "newHandles":newHandles,
        "index":i
      }
      $.post("/updateSearches",{"data":postData},function(data){
        location.reload();
      });
    }
  }
}

function deleteSearch(){
  $.post("/deleteSearch",{"name":currentSearch},function(){
    location.reload();
  });
}

//Statistics code
$("#statSelector").change(function(data){
  if($(this).val()=="Select a search object"){
    $("#statView").fadeOut()
    return -1;
  }
  $.post("/getStats",{"name":$(this).val()},function(data){
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
    $("#responseTime").text((data.averageResponseTime)?(data.averageResponseTime).toFixed(2)+" min.":"NaN");
    $("#statView").fadeIn()
  });
});

var routes = Backbone.Router.extend({
  routes: {
    '': 'home',
    "statistics": "stats",
    'searchManage': 'searches'
  },
  home: function(){
    $("#tweets").attr("style","");
    $("#dashboard").show();
    $("#homeLink").addClass("current");
    $("#statistics").hide();
    $("#statsLink").removeClass("current");
    $("#searches").hide();
    $("#manageLink").removeClass("current");
    updateFooter();
  },
  stats: function(){
    $.get("/getSearches",function(data){
      $("#statSelector").html("");
      $("#statSelector").append("<option>Select a search object</option>");
      for(i=0;i<data.length;i++){
        $("#statSelector").append("<option>"+data[i].name+"</option>");
      }
    });

    $("#dashboard").hide();
    $("#homeLink").removeClass("current");
    $("#statistics").show();
    $("#statsLink").addClass("current");
    $("#searches").hide();
    $("#manageLink").removeClass("current");
    updateFooter();
  },
  searches: function(){
    //Get search objects from db
    $.get("/getSearches",function(data){
      searchesItem=data;
      $("#searchSelector").html("");
      $("#searchSelector").append("<option>Select a search object</option>");
      for(i=0;i<data.length;i++){
        $("#searchSelector").append("<option>"+data[i].name+"</option>");
      }
    });
    $("#dashboard").hide();
    $("#homeLink").removeClass("current");
    $("#statistics").hide();
    $("#statsLink").removeClass("current");
    $("#searches").show();
    $("#manageLink").addClass("current");
    updateFooter();
  }
});
var appRoutes = new routes();
Backbone.history.start();
