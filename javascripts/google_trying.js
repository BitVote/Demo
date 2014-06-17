var feedUrl = "http://www.google.com/calendar/feeds/bitvoter2@gmail.com/public/full";

google.load("gdata", "2");

google.setOnLoadCallback(getMyFeed);

function setupMyService() {
  var myService = new google.gdata.calendar.CalendarService('exampleCo-exampleApp-1');
  return myService;
}

function getMyFeed() {
  myService = setupMyService();

  myService.getEventsFeed(feedUrl, handleMyFeed, handleError);
}

function handleMyFeed(myResultsFeedRoot) {
  alert("This feed's title is: " + myResultsFeedRoot.feed.getTitle().getText());
}

function handleError(e) {
  alert("There was an error!");
  alert(e.cause ? e.cause.statusText : e.message);
}

function handleMyFeed(myResultsFeedRoot) {
  alert("This feed's title is: " + myResultsFeedRoot.feed.getTitle().getText());
  insertIntoMyFeed(myResultsFeedRoot);
}

function insertIntoMyFeed(feedRoot) {
  var newEntry = new google.gdata.calendar.CalendarEventEntry({
      authors: [{
        name: "Jasper den Ouden",
        email: "o.jasper@gmail.com"
      }],
      title: {
        type: 'text', 
        text: 'Derping for getting shit going'
      },
      content: {
        type: 'text', 
        text: 'derp derp'
      },
      locations: [{
        rel: "g.event",
        label: "Remove this field later",
        valueString: "Yep"
      }],
      times: [{
        startTime: google.gdata.DateTime.fromIso8601("2007-09-23T18:00:00.000Z"),
        endTime: google.gdata.DateTime.fromIso8601("2007-09-23T19:00:00.000Z")
      }]
  });
  feedRoot.feed.insertEntry(newEntry, handleMyInsertedEntry, handleError);
}

function handleMyInsertedEntry(insertedEntryRoot) {
  alert("Entry inserted. The title is: " + insertedEntryRoot.entry.getTitle().getText());
  alert("The timestamp is: " + insertedEntryRoot.entry.getTimes()[0].startTime);
}

alert('got_it');
