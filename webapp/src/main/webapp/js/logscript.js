var min=0, max=0, previousMin=0, previousMax=0, commitPadding=4,width=1300,height=500,margin=10,padding=100,bgcolor="#FFFFFF", maxAllowedLane = 25, branchPadding = 3, ypan=0;
var displayHeight = 500;
var maxPaddingHeight = 0;
var minPaddingHeight = 0;
var originalTranslate = 0;
var currentPan = 0;
var commitInfoPanel = null;
var maxY = 0, minY = -1;
var currentPage = 1;
var maxPage = 1;
var pageSize = 250;

// scalers - scales the commits dates base on the idea that they are displayed vertically. So the scale range uses the height as a max.
// X is scaled by the number of branches (from 1 to 10) - TODO : make it dynamic from the branch count in the data.
// Y is scaled by the commit date
var x = d3.scale.linear().domain([0,maxAllowedLane]).range([margin,width-margin]);
var y = d3.scale.linear().domain([min, max]).range([margin, height-margin]);
var availableWidth = d3.select("#svgcontainer")[0][0].clientWidth;
var availableHeight = d3.select("#svgcontainer")[0][0].clientHeight;
var maxAllowedLane = Math.floor(x.invert(availableWidth));
var svg=d3.select("#svgcontainer")
.append("svg").attr("class", "workspace").attr("id", "workspace").attr("width",availableWidth-16).attr("height", displayHeight);

svg.append("clipPath")
    .attr("id", "clipMessage")
  .append("rect")
    .attr("x", 5)
    .attr("y", 5)
    .attr("width", 10)
    .attr("height", 10);
svg.append("clipPath")
    .attr("id", "clipName")
  .append("rect")
    .attr("x", 5)
    .attr("y", 5)
    .attr("width", 10)
    .attr("height", 10);


//.on("mousedown", mousedown)
//.on("mousemove", mousemove)
//.on("mouseup", mouseup)


function doit(d) {
  console.log(d);
}

var svgGroup = svg.insert("g").attr("class", "log");


var linksGroup = svgGroup.insert("g").attr("class", "links-group");
var commitsGroup = svgGroup.insert("g").attr("class", "commits-group");
var infosGroup = svgGroup.insert("g").attr("class", "infos-group");
var origin;


function mousedown() {
  origin = d3.mouse(svgGroup.node());
}

function mousemove() {
      if (!origin) { return; }
        var m = d3.mouse(svgGroup.node());
        ypan = ypan + (m[1]-origin[1]);
        convertedPan = y.invert(ypan);
        maxPaddingHeight = y(max)- (height-2*margin);
        if (convertedPan >= 0) { ypan = y(0); }
        if (convertedPan <= -( maxPaddingHeight )) { ypan = -(y( maxPaddingHeight )); }
        d3.select(".log").attr("transform", "translate(0,"+ypan+")");
          //dragged.x = x.invert(Math.max(0, Math.min(width, m[0])));
          //dragged.y = y.invert(Math.max(0, Math.min(height, m[1])));
          //d3.select(".log").attr("transform", "translate(0,"+ypan+")");
       // update();
    }

    function mouseup() {
      if (!origin) { return; }
        mousemove();
        origin = null;
    }



// The data join should be done on the commits ids.

function key(d) {
  return d.id;
}

function formatMillisecondDate(d) {
  var format = d3.time.format("%a %b %d %H:%M:%S %Y");
  if (d instanceof Date) {
    return format(d);
  }
  return format(new Date(d));
}

var delay = 500;

//setInterval(function() {updateData(); }, 1000);

var repository;
var currentCommits;
var refs;

var diag = d3.svg.diagonal().projection( function (d) { return [d.x, d.y] } );
var line = function(d) {
  return innerLine([d.source, d.target]);
  }

var chosenPathFunction = diag;
var innerLine = d3.svg.line().interpolate("monotone")
  .x(function (d,i) {
    return d.x;
  }).y(function (d,i) {
    return d.y;
  });
//x(function (d) { return x(d.x); }).y(function (d) {return y(d.y); });
//diagonal().projection( function (d) { return [d.x, d.y] } );
//var initline = d3.svg.line().x(function (d) { return x(d.x); }).y(function (d) {return y(d.y); });
//.projection( function (d) {
//   if (d.y < min) {
//     return [d.x, margin];
//   } else if (d.y > max) {
//     return [d.x, height-margin];
//   }
//   return [d.x, margin];}
// );

// buttons
//var resetButton = d3.select("svg").append("g").attr("class","button reset");
//resetButton.append("circle")
//      .attr("cx", 1000)
//      .attr("cy", 200)
//      .attr("r", 30)
//      .on("click", resetZoom);
//resetButton.append("text")
//        .attr("x", 1000)
//        .attr("y", 200)
//        .text("Reset")
//        .on("click", resetZoom);
//var zoomButton = d3.select("svg").append("g").attr("class","button zoom");
//zoomButton.append("circle")
//      .attr("cx", 1000)
//      .attr("cy", 270)
//      .attr("r", 30)
//      .on("click", initBrush);
//zoomButton.append("text")
//        .attr("x", 1000)
//        .attr("y", 270)
//        .text("Zoom")
//        .on("click", initBrush);

function updateData() {
  if (currentCommits.length > 50) {
    currentCommits = currentCommits.slice(1, currentCommits.length);
    redraw(currentCommits);
  }
}

var maxLane = 0;

function loadPage(pageNb) {
  $('#loading').modal('show');
  /*$.ajax({
        type: "POST",
        headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json' 
        },
        url: "/git/json/graph/log2.do",
        data: '{"pageSize": 100, "heads": []}',
        success: showLog,
        dataType: "json"
    });*/
  d3.json("/git/json/graph/"+pageSize+"/"+pageNb+"/log.do", showLog);
}

function oldLoadPage(pageNb) {
  $('#loading').modal('show');
  d3.json("/git/json/graph/"+pageSize+"/"+pageNb+"/log.do", showLog);
}
//d3.json("data.json", function(jrep) {
loadPage(1);

function previousPage() {
    var newPage = currentPage - 1;
    if (currentPage === 1) newPage = 1;
    loadPage(newPage);
}

function nextPage() {
    var newPage = currentPage + 1;
    if (currentPage === maxPage) newPage = currentPage;
    loadPage(newPage);
}

function firstPage() {
    var newPage = 1;
    loadPage(newPage);
}

function lastPage() {
    var newPage = maxPage;
    loadPage(newPage);
}

function showLog(jrep) {
    repository = jrep;
    currentCommits = repository.commits;
    currentPage = repository.currentPage;
    maxPage = repository.maxPage;
    refs = repository.branches;
    max = d3.max(currentCommits, function(d) { if (d.extra) { return 0;} else {return d.position;} });
    min = d3.min(currentCommits, function(d) { if (d.extra) { return max;} else {return d.position;} });
    height = 2*margin + (max-min)*commitPadding;
    //maxPaddingHeight = (((height-margin)*commitPadding)-height)+2*margin;
    minPaddingHeight = y(minY);
    y = d3.scale.linear().domain([min, max]).range([margin, (height-margin)*commitPadding]);
    svgGroup.remove();
    linksGroup.remove();
    commitsGroup.remove();
    infosGroup.remove();
    maxY = 0;
    svgGroup = svg.insert("g").attr("class", "log");
    linksGroup = svgGroup.insert("g").attr("class", "links-group");
    commitsGroup = svgGroup.insert("g").attr("class", "commits-group");
    infosGroup = svgGroup.insert("g").attr("class", "infos-group");
    redraw(currentCommits, refs);
    maxPaddingHeight = y(maxY)-displayHeight+margin;
    if (currentPage === 1) d3.selectAll("li.previous").classed("disabled",true); else d3.selectAll("li.previous").classed("disabled",false);
    if (currentPage === maxPage) d3.selectAll("li.next").classed("disabled",true); else d3.selectAll("li.next").classed("disabled",false);
    $('#loading').modal('hide');
}

function displayDifferences(commitId, parentId, oldId, newId) {
  $("#loading-message").get(0).style.visibility='visible';
   d3.json("/git/json/commit/"+commitId+"/"+parentId+"/"+oldId+"/"+newId+"/differences.do", doDisplayDifferences);
}

function doDisplayDifferences(differencesHolder) {
  $("#loading-message").get(0).style.visibility='hidden';
  $("#fileDiffContents").empty();
  var chunks = differencesHolder.chunks;
  var path = '';
  if (differencesHolder.changeName === 'DELETE') {
      path = differencesHolder.oldPath;
  } else {
      path = differencesHolder.newPath;
  }
  var diffContentHolder = d3.select("#fileDiffContents");
  for (var i=0; i<chunks.length; i++) {
    var chunkId = "chunk"+i;
    diffContentHolder
      .append("div")
        .attr("id", chunkId)
      .append("table")
        .attr("class", "diffTable");
    var diffContents = d3.select("#"+chunkId+" .diffTable").selectAll("tr").data(chunks[i].lines);
    var chunkLine = diffContents.enter()
      .append("tr")
        .attr("style", "width: 100%")
        .attr("class", function(e) { return e.type.toLowerCase(); });
    chunkLine.append("td")
      .text(function(h) {
         if (h.oldLineNumber === 0) {
          return ' ';
         } else {
          return h.oldLineNumber;
         }
       }
     );
    chunkLine.append("td")
      .attr("class", "bordered")
      .text(function(h) {
         if (h.newLineNumber === 0) {
          return ' ';
         } else {
          return h.newLineNumber;
         }
       }
     );
    chunkLine.append("td")
      .attr("class", "bordered")
      .attr("style", "text-align: center;")
      .text(function(f) {
          if (f.type === 'OLD') {
            return ' - ';
          } else if (f.type === 'NEW') {
            return ' + ';
          } else {
            return '   ';
          }
        }
      );
    chunkLine.append("td")
      .attr("class", "bordered")
      .attr("style", "width: 100%; white-space:PRE;")
      .text(function(g) { return g.line; });
        //function (d) { return d.line; }
    diffContents.exit().remove();
    $('#fileDiffName').text(path);
    $('#fileDiffModal').modal({ keyboard: true });
    diffContentHolder.append("br");
  }
}

function showCommitInfos(commit) {
  //if (commitInfoPanel != null) return;
  //commitInfoPanel = svgGroup.append("g" ).attr("class", "commitInfoPanel");

  //var clickedCommit = getCommit(commit.id);
  //if (clickedCommit !== null) {
   // alert(clickedCommit.message);
  //}
  //commitInfoPanel.append("text").attr("x", 150).attr("y", 150).text(clickedCommit.message);

  //d3.json("commit.json", function(jcommit) {
  $("#loading-message").get(0).style.visibility='visible';
  d3.json("/git/json/commit/"+commit.id+"/details.do", function(jcommit) {
    $("#sha1").text(jcommit.id);
    $("#author").text(jcommit.authorName+" <"+jcommit.authorEmail+">");
    $("#adate").text(jcommit.authorDate);
    $("#committer").text(jcommit.committerName+" <"+jcommit.committerEmail+">");
    $("#cdate").text(jcommit.commitDate);
    $("#message").text(jcommit.message);
    $("#tabs").empty();
    $("#tab-contents").empty();

    var tabsHolder = d3.select("#tabs");
    var tabs = tabsHolder.selectAll("li").data(jcommit.differences).enter();
    tabs.append("li")
        .attr("class", function(d,i) { if (i === 0) { return "active"; } else { return "";} })
      .append("a")
        .attr("href", function(d,i) { return "#tab"+i; })
        .attr("data-toggle", "tab")
        .text(function (d) {
          return d.parentCommitId.substring(0,7);}
        );
    var tabContentsHolder = d3.select("#tab-contents");
    var tabContents = tabContentsHolder.selectAll("div").data(jcommit.differences).enter();
    tabContents
      .append("div")
        .attr("class", function(d,i) { if (i === 0) { return "tab-pane active"; } else { return "tab-pane";} })
        .attr("id", function(d,i) { return "tab"+i; })
        .attr("style", "overflow: auto; height: 200px;")
      .append("table")
        .attr("class", "table diffElementHolder")
      .append("tbody")
        .attr("id", function(d,i) { return "diff"+i; });
//<!--li class="active"><a href="#tab1" data-toggle="tab">Section 1</a></li>
//          <li><a href="#tab2" data-toggle="tab">Section 2</a></li-->

    for (var i=0; i<jcommit.differences.length; i++) {
      var diffHolder = d3.select("#diff"+i);

      var diffSelection = diffHolder.selectAll("tr").data(jcommit.differences[i].differences);
      var diffSelectionLines = diffSelection
        .enter()
        .append("tr")
          .attr("class", "diffElement")
          .on('mouseover', function(){d3.select(this).classed("hovered", true);})
          .on('mouseout', function(){d3.select(this).classed("hovered", false);});

      diffSelectionLines.append("td").attr("style", "border-top: none; padding: 0px;")
        .append("i")
          .attr("class", function (d)
            {
              if (d.changeName === 'MODIFY') {
                return "icon-pencil";
              } else if (d.changeName === 'ADD') {
                return "icon-plus-sign";
              } else if (d.changeName === 'DELETE') {
                return "icon-trash";
              }  else if (d.changeName === 'RENAME') {
                return "icon-text-height";
              }  else if (d.changeName === 'COPY') {
                return "icon-share";
              }
            })

      diffSelectionLines.append("td").attr("style", "border-top: none; padding: 0px;")
          .on("click", function(d) {
            displayDifferences(commit.id, d.parentId, d.oldId, d.newId);
           })
          .text(function (d) {
            return d.name;
          });
        diffSelection.exit().remove();
    }
    $("#loading-message").get(0).style.visibility='hidden';
  });
}

var brush;

function initBrush() {
  brush = svgGroup.append("g")
    .attr("class", "brush");
  brush.call(d3.svg.brush().x(x).y(y)
    .on("brushstart", brushstart)
    .on("brush", brushmove)
    .on("brushend", brushend));
}

function resetBrush() {
  if (brush !== undefined) {
    brush.remove();
  }
}


function brushstart() {
  svgGroup.classed("selecting", true);
}

function brushmove() {
  var brushRect = d3.select("g.brush .extent");
  var bx = (+brushRect.attr("x"))-30;
  var by = (+brushRect.attr("y"));
  var bw = (+brushRect.attr("width"));
  var bh = (+brushRect.attr("height"));
  var bx2 = (+(bx+bw));
  var by2 = (+(by+bh));

  d3.selectAll(".circle").classed("selected", function(d) {
    var cx = x(d.lane);
    var cy = y (+d.position);
    if (cx > bx && cx < bx2 && cy > by && cy < by2) {
      return true;
    }
    return false;
 });
  var linkContainer = d3.selectAll(".link").classed("selected", function(d) {
    var sx = d.source.x;
    var sy = d.source.y;
    var tx = d.target.x;
    var ty = d.target.y;
    if (sx > bx && sx < bx2 && sy > by && sy < by2) {
      if (tx > bx && tx < bx2 && ty > by && ty < by2) {
        return true;
      }
    }
    return false;
 });
}

function brushend() {
  svgGroup.classed("selecting", false);
  var brushRect = d3.select("g.brush .extent");
  var bw = (+brushRect.attr("width"));
  var bh = (+brushRect.attr("height"));
  if (bw > 10 && bh > 10) {
    zoom();
  }
}



//var zoom = d3.behavior.zoom().on('zoom', pan);
//svg.call(zoom);

// Firefox
svg.on("wheel", mozPan);
// IE9, Chrome, Safari, Opera
svg.on("mousewheel", miscPan)

function miscPan() {
  var delta = +d3.event.wheelDeltaY;
  pan(delta);
}
function mozPan() {
  var delta = -d3.event.deltaY;
  pan(delta);
}

function pan(delta) {
  currentPan = currentPan+delta;
  if (currentPan < (-maxPaddingHeight)) {
    currentPan = -maxPaddingHeight;
  } else if (currentPan > 0) {
    currentPan = 0;
  }
  svgGroup.attr("transform", "translate(0, "+currentPan+")");
}


/*function pan() {
  console.log(d3.mouse);
  var currentTranslate = zoom.translate()[1];
  var panDirection = 1;
  if (currentTranslate - originalTranslate < 0) {
    panDirection = -1;
  }

  var panFactor = 25;
  originalTranslate = currentTranslate;
  currentPan = currentPan+panDirection*panFactor;
  if (currentPan > maxPaddingHeight) { currentPan = maxPaddingHeight; }
  else if (currentPan < minPaddingHeight) { currentPan = minPaddingHeight; }
  svgGroup.transition().duration(0.1).attr("transform", "translate(0, " + -currentPan + ")");

}*/
//svg.call(d3.behavior.zoom().scaleExtent([1,1])
//      .on("zoom", function() {

        //convertedPan = y.invert(ypan);
        //var maxPaddingHeight = (max*commitPadding) - y.invert(height-4*margin);
        //  if (convertedPan >= 0) { ypan = y(0); }
        //  if (convertedPan <= -( maxPaddingHeight )) { ypan = -(y( maxPaddingHeight )); }
        //d3.select(".log").attr("transform", "translate(0,"+ypan+")");
        //var currentTranslate = d3.event.translate[1];
        //var delta = currentTranslate - originalTranslate;
        //originalTranslate = currentTranslate;
        //currentPan = currentPan + delta;
        //var convertedPan = y.invert(currentPan);

        //if (currentTranslate <= -(maxPaddingHeight)) { currentTranslate = -(maxPaddingHeight); d3.event.translate[1] = y(currentTranslate); }
//        console.log("ypan : "+ypan);
        //svgGroup.attr("transform", "translate(0, " + d3.event.translate[1] + ")");
//      }
//    )
//  );

function zoom2() {
  var selectedCommitsSelection = svgGroup.selectAll(".circle.selected")[0];
  if (selectedCommitsSelection.length === 0) { return; }
  var selectedCommits = [];
  for (var i=0; i< selectedCommitsSelection.length; i++) {
    selectedCommits.push(selectedCommitsSelection[i].__data__);
  }
  svgGroup.selectAll(".selected").classed("selected", false);
  resetBrush();
  redraw(selectedCommits);
}

function resetZoom() {
  redraw(originalCommits);
}

function getCommit(id) {
  for (var i=0; i< currentCommits.length; i++) {
    if (currentCommits[i].id == id) {
      return currentCommits[i];
    }
  }
  return null;
}

function redraw(commits, references) {
  previousMax = max;
  previousMin = min;
  maxLane = d3.max(commits, function(d) { return d.lane;})+1;
  svg.select("#clipMessage").select("rect")
    .attr("width", x(maxAllowedLane-7)-margin)
    .attr("height", y(max));
  svg.select("#clipName").select("rect")
    .attr("width", x(maxAllowedLane-4)-margin)
    .attr("height", y(max));


  var nodes = [];
  var links = [];
  var infos = [];
  commits.forEach(function(d, i) {
      if ((d.position > maxY) && (d.extra === false)){
        maxY = d.position;
      }
      if (minY == -1 && (d.extra === false)) {
        minY = d.position;
      }
      var source = {"id": d.id ,"x": x(d.lane), "y": y(d.position)};
      nodes.push(d);
      //var info = {"id": d.id ,"committer": d.committerName, "date": d.date, "x": x(d.lane)+margin, "y": y(d.position)};
      var info = {
        "id": d.id,
        "message": d.message,
        "author": d.author,
        "date": d.date,
        "x": x(d.lane)+margin,
        "y": y(d.position),
        "branches": []
      };
      infos.push(info);
      for (var j=0; j<references.length; j++) {
        if (references[j].target == d.id) {
          var branch = {
            "name": references[j].name,
            "x": x(d.lane)+margin,
            "y": y(d.position),
            "symbolic": references[j].symbolic,
            "remote": references[j].name.indexOf("origin") !== -1,
            "current": references[j].current
          };
          info.branches.push(branch);
        }
      }
      if (d.parents !== null) {
        d.parents.forEach(function(c, i) {
          var target = {"id": c.id ,"x": x(c.lane), "y": y(c.position)};
            links.push({"id": source.id + "-" + target.id ,"source": source, "target": target});
        });
    }
  });

  var linksSelection = linksGroup.selectAll("path").data(links, key);
  var linksEnterSelection = linksSelection.enter();
  var linksExitingSelection = linksSelection.exit();

  var enteringLinks = linksEnterSelection.append("path").attr("class", "link").attr("d", chosenPathFunction)
      .attr("transform", "translate(30,0)");
  enteringLinks.transition()
      .duration(delay)
      .style("opacity", 1);

  var commitsSelection = commitsGroup.selectAll(".circle").data(nodes, key);
  var commitsEnterSelection = commitsSelection.enter().append("g").attr("class", "circle");
  var commitsExitingSelection = commitsSelection.exit();


  var enteringCommits = commitsEnterSelection.append("circle")
      .attr("class", function (d) {
        if (d.parentCount===0) {
          return "commit root";
        } else if (d.childCount === 0) {
          return "commit tip";
        }
        return "commit";
      })
      .attr("cx", function(d) {return x(d.lane);})
      .attr("cy", function(d) { return y(+d.position); })
      .attr("r", 4)
      .attr("transform", "translate(30,0)");
  enteringCommits.transition()
      .duration(delay)
      .style("opacity", 1);
  commitsSelection.select(".circle").attr("cy", function(d) { return y(+d.position); }).transition();

  var infosSelection = infosGroup.selectAll(".info").data(infos, key);
  var infosEnterSelection = infosSelection.enter().append("g").attr("class", function (d, i) { return "info info"+i; })
    .on('mouseover', function(){d3.select(this).classed("selected", true);})
    .on('mouseout', function(){d3.select(this).classed("selected", false);})
    .on("click", function(d) { showCommitInfos(d); });
  var infosExitingSelection = infosSelection.exit();

  var branchesPaddings = new Object();

  infos.forEach(
    function(d, i) {
      var currentPadding = 0;
      if (d.branches.length > 0) {
        d.branches.forEach(
          function(e,j) {
            var branchHolder = d3.select(".info"+i).append("g").attr("class", "branchHolder");
            var qualifier = e.remote === true ? "remote" : "local";
            if (e.symbolic) { qualifier = qualifier+" symbolic"}
            if (e.current) { qualifier = qualifier+" current"}
            branchHolder.append("text").attr("class", "branchName "+qualifier)
                .attr("x", function(d) { return currentPadding+x(maxLane+3)+margin; })
                .attr("y", function(d) { return d.y; })
                .text( function (f) { return e.name; })
                .attr("dy", ".30em");
            var branchesNames = d3.selectAll(".branchName");
            branchesNames.each( function(g, k) {
              if (this.textContent === e.name) {
                branchHolder.insert("rect").attr("class", "branchBox "+qualifier)
                .attr("x", this.getBBox().x)
                .attr("y", this.getBBox().y)
                .attr("width", this.getBBox().width)
                .attr("height", this.getBBox().height);
                currentPadding = currentPadding + this.getBBox().width + branchPadding;
              }
            });
          }
        );
      }
      branchesPaddings[d.id] = currentPadding;
    }
  );

  var infoHolder = infosEnterSelection.append("rect").attr("class", "infoHolder")
      .attr("x", function(d) { return x(maxLane); })
      .attr("y", function(d) { return d.y - margin - commitPadding + 2; })
      .attr("width", function(d) { return x(maxLane+1); })
      .attr("height", function(d) { return (2*margin)+commitPadding; } );
  infosEnterSelection.append("line").attr("class", "infoLine")
      .attr("x1", function(d) { return d.x+x(0.5); })
      .attr("y1", function(d) { return d.y; })
      .attr("x2", function(d) { return x(maxLane+1); })
      .attr("y2", function(d) { return d.y; });
  var textTable = infosEnterSelection.append("text").attr("class", "commitInfo")
      .attr("x", function(d) { return x(maxLane+1)+margin; })
      .attr("y", function(d) { return d.y; })
      .attr("dy", ".30em")
  textTable.append("tspan")
      .attr("x", function(d) { return x(maxLane+1)+margin; })
      .text(function (d) { return d.id.substring(0,7); })
  textTable.append("tspan")
      .attr("x", function(d) { return branchesPaddings[d.id] + x(maxLane+3)+margin; })
      .attr("clip-path", "url(#clipMessage)")
      .text(function (d) { return d.message; })
  textTable.append("tspan")
      .attr("x", function(d) { return x(maxAllowedLane-7)+margin; })
      .attr("clip-path", "url(#clipName)")
      .text(function (d) { return d.author; });
  textTable.append("tspan")
      .attr("x", function(d) { return x(maxAllowedLane-4)+margin; })
      .text(function (d) { return d.date; });

  commitsExitingSelection.transition().remove();
  linksExitingSelection.transition().remove();
  infosExitingSelection.transition().remove();
}