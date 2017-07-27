var searchesItem=[];
var searchTerms=[];
var id;
var searchName;
var currentSearch;
var tweets;
setInterval(updateFooter,500);
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
        {"targets": [ 3 ],"searchable": false},
        {"targets": [ 1 ],"orderable": false},
        {"targets": [ 0 ],"visible": false}
    ],
    "order": [[ 0, "desc" ]],
    "searching": true,
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
$.get("/getTweets",function(data){
  tweets=data;
  table.rows.add(tweets).draw();
});
function modifySearch(data){
  var filter=searchTerms.slice();
  var temp=[];
  $(".searchControl").each(function(index,item){
    if(!$(item).is(":checked")){
      temp.push($(item).val());
    }
  });
  temp.reverse();
  for(i=0;i<temp.length;i++){
    filter.splice(temp[i],1);
  }
  temp=tweets.filter(function(n){return filter.toString().includes(n.handle)});
  table.clear();
  table.rows.add(temp).draw();
  updateFooter();
}
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
      setMessage("");
      $("#generalAccount").fadeOut();
    }
    else if (event.target == $("#passwordChange")[0] ){
      resetPass();
      $("#passwordChange").fadeOut();
    }
    else if (event.target == $("#newSearch")[0] ){
      setMessage("");
      $("#newSearch").fadeOut();
    }
    else if (event.target == $("#addUser")[0] ){
      setMessage("");
      $("#addUser").fadeOut();
    }
    else if (event.target == $("#manageUsers")[0] ){
      setMessage("");
      $("#manageUsers").fadeOut();
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
$("#newUser").click(function(){
  $("#addUser").fadeIn();
});
$("#userManage").click(function(){
  $.get("/getUsers",function(data){
    $("#users").html("");
    var temp;
    for(i=0;i<data.length;i++){
      temp="<tr><td>";
      temp+=data[i].name+"</td><td>"+data[i].uname+"</td><td>";
      temp+="<button class=\"btn btn-danger\" onclick=\"$.post('/deleteUser',{id:'"+data[i]._id+"'},function(data){formSuccess(data)})\">X</button</form></tr>";
      $("#users").append(temp);
    }
  })
  $("#manageUsers").fadeIn();
});
//Validate input from password form and post to /updatePassword
$('#passwordForm').click(function(ev) {
  current=$("#current").val();
  newPass=$("#newPass").val();
  newPass2=$("#newPass2").val();
  if(current==newPass){
    setMessage("New password Matches old password");
  }
  else if(newPass.includes("\"") || newPass.includes("\'")){
    setMessage("New password contains invalid characters");
  }
  else if(newPass!=newPass2){
    setMessage("New passwords do not match");
  }
  else{
    setMessage("Updating Password");
    $.post("/updatePassword",{currentPassword:current,newPassword:newPass},function(data){
      if(data.includes("Success")){
        $("#current").val("");
        $("#newPass").val("");
        $("#newPass2").val("");
        setMessage(data);
      }
      else{
        setMessage(data);
      }
    });
  }
});
function resetPass(){
  $("#current").val("");
  $("#newPass").val("");
  $("#newPass2").val("");
  setMessage("");
}


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
  $("#managmentContent").fadeOut();
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
      $("#managmentContent").fadeIn();
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
  if(window.confirm("Are you sure you want to delete this search and all related tweets and statistics?")){
    $.post("/deleteSearch",{"name":currentSearch},function(){
      location.reload();
    });
  }
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

function setMessage(message){
  $(".message").each(function(){
    $(this).text(message);
  });
}

$("form").submit(function(e){
    var form = $(this);
    $.ajax({
         url   : form.attr('action'),
         type  : form.attr('method'),
         data  : form.serialize(), // data to be submitted
         success: function(data){
           formSuccess(data);
         },
         error: function(data){
           alert("Unknown error occured");
         }
    });
    return false;
 });

function formSuccess(data){
  if(data.includes("Success")){
    location.reload();
  }
  else if(data.includes("Invalid")){
    setMessage(data);
  }
  else{
    alert("Unknown error occured");
  }
}

var routes = Backbone.Router.extend({
  routes: {
    '': 'home',
    "statistics": "stats",
    'searchManage': 'searches'
  },
  home: function(){
    $.get("/getSearches",function(data){
      $("#tableOptions").html("");
      if(data.length!=1){
        for(i=0;i<data.length;i++){
          $("#tableOptions").append("<label class='checkbox-inline'><input type='checkbox' class='searchControl' onclick='modifySearch()' checked=true value="+i+">"+data[i].name+"</label>");
          searchTerms.push(data[i].terms);
        }
        updateFooter();
      }
    });
    $("#tweets").attr("style","");
    $("#dashboard").show();
    $("#homeLink").addClass("current");
    $("#statistics").hide();
    $("#statsLink").removeClass("current");
    $("#searches").hide();
    $("#manageLink").removeClass("current");
    $("#statView").hide();
    $("#managmentContent").hide();
  },
  stats: function(){
    $.get("/getSearches",function(data){
      if(data.length>1){
        $("#statSelector").html("");
        $("#statSelector").append("<option>Select a search object</option>");
        for(i=0;i<data.length;i++){
          $("#statSelector").append("<option>"+data[i].name+"</option>");
        }
      }
      else{
        $("#statSelector").html("");
        for(i=0;i<data.length;i++){
          $("#statSelector").append("<option>"+data[i].name+"</option>");
          $("#statSelector").change();
        }
      }
    });
    $("#tableOptions").html("");
    $("#dashboard").hide();
    $("#homeLink").removeClass("current");
    $("#statistics").show();
    $("#statsLink").addClass("current");
    $("#searches").hide();
    $("#manageLink").removeClass("current");
    $("#statView").hide();
    $("#managmentContent").hide();
    updateFooter();
  },
  searches: function(){
    //Get search objects from db
    $.get("/getSearches",function(data){
      searchesItem=data;
      if(data.length>1){
        $("#searchSelector").html("");
        $("#searchSelector").append("<option>Select a search object</option>");
        for(i=0;i<searchesItem.length;i++){
          $("#searchSelector").append("<option>"+data[i].name+"</option>");
        }
      }
      else{
        $("#searchSelector").html("");
        for(i=0;i<searchesItem.length;i++){
          $("#searchSelector").append("<option>"+data[i].name+"</option>");
          $("#searchSelector").change();
        }
      }
    });
    $("#tableOptions").html("");
    $("#dashboard").hide();
    $("#homeLink").removeClass("current");
    $("#statistics").hide();
    $("#statsLink").removeClass("current");
    $("#searches").show();
    $("#manageLink").addClass("current");
    $("#statView").hide();
    $("#managmentContent").hide();
    updateFooter();
  }
});
var appRoutes = new routes();
Backbone.history.start();
