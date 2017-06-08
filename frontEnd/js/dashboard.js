var table=$("#tweets").DataTable({
    columns: [
        {data: "dateTime"},
        {data: "screenName"},
        {data: "replyFound"},
        {data: "score"},
        {data: "id"}
    ],
    ajax: {
        url: "/getTweets",
        dataSrc: "",
        type: "GET",
    },
})
var id;
$("#tweets tbody").on("click", "tr", function (event) {
  var name=$(this).find("td:nth-child(2)").text();
  id=$(this).find("td:nth-child(5)").text();
  //window.open('https://twitter.com/'+name+'/status/'+id, '_blank');
  $.post("/getTweetInfo",{"id":id},function(data){
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
