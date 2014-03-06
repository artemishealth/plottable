///<reference path="exampleReference.ts" />

module DemoDay {
  var N_BINS = 25;
  function makeScatterPlotWithSparkline(data) {
    var s: any = {};
    s.xScale = new LinearScale();
    s.yScale = new LinearScale();
    s.leftAxis = new Plottable.YAxis(s.yScale, "left");
    var leftAxisTable = new Table([[new AxisLabel("y", "vertical-left"), s.leftAxis]]);
    s.xAxis = new Plottable.XAxis(s.xScale, "bottom");
    var xAxisTable = new Table([[s.xAxis], [new AxisLabel("x")]]);

    s.renderer = new CircleRenderer(data, s.xScale, s.yScale, null, null, 1.5);
    s.xSpark = new LinearScale();
    s.ySpark = new LinearScale();
    s.sparkline = new CircleRenderer(data, s.xSpark, s.ySpark, null, null, 0.5);
    var r1 = [leftAxisTable, s.renderer];
    var r2 = [null, xAxisTable];
    var r3 = [null, s.sparkline];
    s.table = new Table([r1,r2,r3]);
    s.table.rowWeight(2, 0.25);
    return s;
  }

  function makeHistograms(data: any[]) {
    var h: any = {};
    var xExtent = d3.extent(data, (d) => d.x);
    h.xScale1 = new LinearScale().domain(xExtent);
    h.yScale1 = new LinearScale();
    h.bin1 = makeBinFunction((d) => d.x, xExtent, N_BINS);
    var data1 = h.bin1(data);
    var ds1 = {data: data1, seriesName: "xVals"}
    h.renderer1 = new BarRenderer(ds1, h.xScale1, h.yScale1);
    h.xAxis1 = new Plottable.XAxis(h.xScale1, "bottom");
    h.yAxis1 = new Plottable.YAxis(h.yScale1, "right");
    var labelX1Table = new Table([[h.xAxis1], [new AxisLabel("X values")]]);
    var labelY1Table = new Table([[h.yAxis1, new AxisLabel("Counts", "vertical-right")]]);
    var table1 = new Table([[h.renderer1, labelY1Table], [labelX1Table, null]]);

    var yExtent = d3.extent(data, (d) => d.y);
    h.xScale2 = new LinearScale().domain(yExtent);
    h.yScale2 = new LinearScale();
    h.bin2 = makeBinFunction((d) => d.y, yExtent, N_BINS);
    var data2 = h.bin2(data);
    var ds2 = {data: data2, seriesName: "yVals"}
    h.renderer2 = new BarRenderer(ds2, h.xScale2, h.yScale2);
    h.xAxis2 = new Plottable.XAxis(h.xScale2, "bottom");
    h.yAxis2 = new Plottable.YAxis(h.yScale2, "right");
    var labelX2Table = new Table([[h.xAxis2], [new AxisLabel("Y values")]]);
    var labelY2Table = new Table([[h.yAxis2, new AxisLabel("Counts", "vertical-right")]]);
    var table2 = new Table([[h.renderer2, labelY2Table], [labelX2Table, null]]);

    h.table = new Table([[table1], [table2]]);
    h.table.padding(5, 5);
    return h;
  }

  function makeScatterHisto(data) {
    var s = makeScatterPlotWithSparkline(data);
    var h = makeHistograms(data.data);
    var r = [s.table, h.table];
    var titleRow = [ new TitleLabel("Random Data").classed("scatterplot-title", true),
                      new TitleLabel("Histograms").classed("histogram-title", true) ];
    var chartTable = new Table([titleRow, r]);
    chartTable.padding(0, 10);
    var table = new Table([[new TitleLabel("Glorious Demo Day Demo of Glory").classed("demo-table-title", true)], [chartTable]]);

    return {table: table, s: s, h: h};
  }

  function coordinator(chart: any, dataset: IDataset) {
    var scatterplot = chart.s;
    var histogram = chart.h;
    chart.c = {};

    var lastSelection = null;
    var selectionCallback = (selection: D3.Selection) => {
      if (lastSelection != null) lastSelection.classed("selected-point", false);
      if (selection != null) {
        selection.classed("selected-point", true);
        lastSelection = selection;
      }
    }

    var data = dataset.data;
    // var lastSelectedData = null;
    var dataCallback = (selectedIndices: number[]) => {
      var selectedData = grabIndices(data, selectedIndices);
      // selectedData.forEach((d) => d.selected = true);
      // if (lastSelectedData != null) lastSelectedData.forEach((d) => d.selected = false);
      // lastSelectedData = selectedData;
      var xBins = histogram.bin1(selectedData);
      var yBins = histogram.bin2(selectedData);
      chart.c.xBins = xBins;
      chart.c.yBins = yBins;
      histogram.renderer1.data({seriesName: "xBins", data: xBins})
      histogram.renderer2.data({seriesName: "yBins", data: yBins})
      histogram.renderer1.render();
      histogram.renderer2.render();
    };

    var firstCallback = (area: SelectionArea) => {
      var r: XYRenderer = scatterplot.renderer;
      var dataArea = r.invertXYSelectionArea(area);
      var indices = r.getDataIndicesFromArea(dataArea);
      var selection = r.getSelectionFromArea(dataArea);

      dataCallback(indices);
      selectionCallback(selection);
    }

    var areaInteraction = new AreaInteraction(scatterplot.renderer).callback(firstCallback);
    var zoomCallback = new ZoomCallbackGenerator().addXScale(scatterplot.xSpark, scatterplot.xScale)
                                                  .addYScale(scatterplot.ySpark, scatterplot.yScale)
                                                  .getCallback();

    var secondCallback = (area: SelectionArea) => {
      var renderer: CircleRenderer = scatterplot.sparkline;
      var dataArea = renderer.invertXYSelectionArea(area);
      var indices  = renderer.getDataIndicesFromArea(dataArea);
      areaInteraction.clearBox();
      selectionCallback(null);
      dataCallback(indices);
      zoomCallback(area);
    };

    chart.c.zoom = new AreaInteraction(scatterplot.sparkline).callback(secondCallback);
  }

  function grabIndices(itemsToGrab: any[], indices: number[]) {
    return indices.map((i) => itemsToGrab[i]);
  }
  var clump1 = makeNormallyDistributedData(300, -10, 5, 7, 1);
  var clump2 = makeNormallyDistributedData(300, 2, 0.5, 3, 3);
  var clump3 = makeNormallyDistributedData(30, 5, 10, -3, 9);
  var clump4 = makeNormallyDistributedData(200, -25, 1, 20, 5);

  var clumpData = clump1.concat(clump2, clump3, clump4);
  var dataset = {seriesName: "clumpedData", data: clumpData};

  var chartSH = makeScatterHisto(dataset);

  coordinator(chartSH, dataset);

  var svg = d3.select("#table");
  chartSH.table.anchor(svg);
  chartSH.table.computeLayout();
  chartSH.table.render();
}
