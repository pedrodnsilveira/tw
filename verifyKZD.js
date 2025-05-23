//check if we got recent version of village list
var currentTime = Date.parse(new Date());
var villageListData;
if (localStorage.getItem("barbmapVillageTime") != null) {
    mapVillageTime = localStorage.getItem("barbmapVillageTime");
    if (currentTime >= parseInt(mapVillageTime) + 60 * 60 * 24 * 1000) {
        //hour has passed
        console.log("Hour has passed, recollecting the village data");
        $.get("map/village.txt", function (data) {
            villageListData = data;
            console.log("Pedro: ")
            console.log(data);
            localStorage.setItem("barbmapVillageTime", Date.parse(new Date()));
            localStorage.setItem("barbmapVillageTxt", data);
        })
            .done(function () {
                finish(villageListData);
            });
    }
    else {
        // within same hour
        console.log("Hour not over yet, waiting to recollect, using old data");
        data = localStorage.getItem("barbmapVillageTxt");

        finish(data);
    }
}
else {
    //get villageTxt for first time
    console.log("Grabbing village.txt for the first time");
    $.get("map/village.txt", function (data) {
        villageListData = data;
        localStorage.setItem("barbmapVillageTime", Date.parse(new Date()));
        localStorage.setItem("barbmapVillageTxt", data);

    })
        .done(function () {
            finish(villageListData);
        });
}