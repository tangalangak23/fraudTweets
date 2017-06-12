var table=$("#tweets").DataTable({
    columns: [
        {data: "id"},
        {data: "screenName"},
        {data: "replyFound"},
        {data: "score"},
        {data: "fraud"}
    ],
    "order": [[ 0, "desc" ]],
    "searching": false,
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
    }
})
var id;
$("#tweets tbody").on("click", "tr", function (event) {
  var name=$(this).find("td:nth-child(2)").text();
  id=$(this).find("td:nth-child(1)").text();
  //window.open('https://twitter.com/'+name+'/status/'+id, '_blank');
  $.post("/getTweetInfo",{"id":id},function(data){
    if(data.replyFound){
      $("#reply").show();
      $("#replyId").text(data.lastReply.screenName);
      $("#replyText").text(data.lastReply.text);
      $("#replyText").append("<br>-@"+data.lastReply.screenName);
    }
    else{
      $("#reply").hide();
    }
    $("#name").text(data.name);
    $("#score").text(data.score);
    $("#text").text(data.text);
    $("#text").append("<br>-@"+data.screenName);
    $("#link").attr("href",'https://twitter.com/'+name+'/status/'+id);
    $("#detailedView").show();
  });
});

$("#delete").click(function(){
  $.post("/deleteRecord",{"id":id});
  location.reload();
});
