var era = ee.ImageCollection("ECMWF/ERA5/MONTHLY"),
    SoilCarb = ee.Image("OpenLandMap/SOL/SOL_ORGANIC-CARBON_USDA-6A1C_M/v02"),
    SoilText = ee.Image("OpenLandMap/SOL/SOL_TEXTURE-CLASS_USDA-TT_M/v02"),
    modis_brdf = ee.ImageCollection("MODIS/061/MCD43A4"),
    elevation = ee.Image("USGS/SRTMGL1_003"),
    geometry = 
    /* color: #ff0000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-102.06684219679389, 40.026304472470144],
          [-102.06684219679389, 38.95807854350606],
          [-98.59516250929389, 38.95807854350606],
          [-98.59516250929389, 40.026304472470144]]], null, false),
    geometry2 = 
    /* color: #00ff00 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-102.06754536224851, 38.959299687985855],
          [-102.06754536224851, 38.047980573617494],
          [-98.59586567474851, 38.047980573617494],
          [-98.59586567474851, 38.959299687985855]]], null, false),
    geometry3 = 
    /* color: #999900 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-102.05208302412156, 38.074890259492065],
          [-102.05208302412156, 36.959532714074115],
          [-98.59138966474656, 36.959532714074115],
          [-98.59138966474656, 38.074890259492065]]], null, false),
    geometry4 = 
    /* color: #009999 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-98.59138966474656, 40.003197880818284],
          [-98.59138966474656, 38.93461425569354],
          [-96.83357716474656, 38.93461425569354],
          [-96.83357716474656, 40.003197880818284]]], null, false),
    geometry5 = 
    /* color: #ff00ff */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-98.61336232099656, 38.93461425569354],
          [-98.61336232099656, 38.06624125177006],
          [-96.82259083662156, 38.06624125177006],
          [-96.82259083662156, 38.93461425569354]]], null, false),
    geometry6 = 
    /* color: #ff9999 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-98.6080993331456, 38.06825873951441],
          [-98.6080993331456, 36.97913532521948],
          [-96.7623962081456, 36.97913532521948],
          [-96.7623962081456, 38.06825873951441]]], null, false),
    geometry7 = /* color: #99ff99 */ee.Geometry.Polygon(
        [[[-96.83821678286573, 39.0035066008532],
          [-94.60249900942823, 39.01631177777766],
          [-94.83321190005323, 39.280432714110304],
          [-95.1297102149741, 39.54950913102733],
          [-94.91011619692823, 39.75926125653967],
          [-95.32759666567823, 40.00374828430583],
          [-96.82173729067823, 39.99533221204811]]]),
    geometry8 = 
    /* color: #9999ff */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-96.84437726378616, 39.01034412228248],
          [-96.84437726378616, 38.082382216654935],
          [-94.60316632628616, 38.082382216654935],
          [-94.60316632628616, 39.01034412228248]]], null, false),
    geometry9 = 
    /* color: #ffff99 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-96.82240460753616, 38.06194214443664],
          [-96.82240460753616, 36.97272584355033],
          [-94.62513898253616, 36.97272584355033],
          [-94.62513898253616, 38.06194214443664]]], null, false),
    era2 = ee.ImageCollection("ECMWF/ERA5/MONTHLY"),
    SoilText2 = ee.Image("OpenLandMap/SOL/SOL_TEXTURE-CLASS_USDA-TT_M/v02"),
    geometry10 = 
    /* color: #99ffff */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-95.90298439754245, 39.900476482279274],
          [-95.90298439754245, 39.87518700913449],
          [-95.83706642879245, 39.87518700913449],
          [-95.83706642879245, 39.900476482279274]]], null, false);

// Определяем область интересов
var counties = ee.FeatureCollection("TIGER/2018/Counties");

// Определяем интересующую дату
var START_DATE = '2020-01-01';
var END_DATE = '2020-12-31';

var proj = ee.Projection('EPSG:5070').atScale(1000);


var cropData = ee.ImageCollection("USDA/NASS/CDL")
  .filterDate(START_DATE, END_DATE)
  .select('cropland');

// Фильтруем по желаемому типу культур
var cornFields = cropData.map(function(image) {
  return image.eq(24);
}).mean();


  // Данные о климате

  var temp = era.filterDate(START_DATE, END_DATE).select('mean_2m_air_temperature').mean().rename('ann_temp');
  var dewpoint = era.filterDate(START_DATE, END_DATE).select('dewpoint_2m_temperature').mean().rename('ann_dewpoint');
  var precip = era.filterDate(START_DATE, END_DATE).select('total_precipitation').mean().rename('ann_precip');

  /**
  * Calculate relative humidity from dewpoint temperature and temperature
  * @param {ee.Image} dewpoint - Dewpoint temperature image (°C)
  * @param {ee.Image} temperature - Temperature image (°C)
  * @returns {ee.Image} Relative humidity image (%)
  */
  var computeRelativeHumidity = function(dewpoint, temperature) {
    return ee.Image().expression(
      "(exp(((18.678 - Td / 234.5) * Td) / (257.14 + Td)) / exp(((18.678 - T / 234.5) * T) / (257.14 + T))) * 100", {
        'Td': dewpoint,
        'T': temperature
      }).rename('relative_humidity_2m');
  };

  // Подсчет относительной влажности с помощью формулы Ардена Бака
  var humidity = computeRelativeHumidity(
    dewpoint.subtract(273.15),
    temp.subtract(273.15)
  ).rename('ann_humidity');


  /**
   * Compute Baseflow Index (BFI) using a digital filter method
   * @param {ee.ImageCollection} precip - Precipitation collection (must have a 'ppt' band)
   * @returns {ee.Image} Baseflow index image (0-1)
   */
  var computeBaseFlowIndex = function(precipColl, geometry) {
    var filteredPrecip = precipColl.filterDate(START_DATE, END_DATE);
    var monthlyPrecip = filteredPrecip.map(function(img) {
      var sumResult = img.reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: geometry,
        scale: 5000,
        maxPixels: 1e9
      }).getNumber('total_precipitation');

    var sum = ee.Number(
      ee.Algorithms.If(
        ee.Number(sumResult), 
        sumResult,
        0
      )
    );

    return ee.Image.constant(sum)
      .rename('precipitation')
      .toFloat();
  });

  var totalPrecip = monthlyPrecip.sum().rename('total_precip');

  var alpha = 0.925;
  var baseflow = monthlyPrecip.iterate(function(img, prev) {
    var prevImg = ee.Image(prev).select('precipitation');
    var currentImg = ee.Image(img).select('precipitation');
    var bf = prevImg.multiply(alpha).add(currentImg.multiply(1 - alpha));
    return bf.rename('precipitation');
  }, ee.Image(0).rename('precipitation'));

  var totalBaseflow = ee.Image(baseflow)
    .reduce(ee.Reducer.sum())
    .rename('total_baseflow');

  return totalBaseflow.divide(totalPrecip)
    .rename('baseflow_index')
    .clamp(0, 1);
};
var BFI = computeBaseFlowIndex(era.select('total_precipitation'), aoi).rename('bfi');

  /**
  * Calculate Heat Index using Rothfusz equation
  * @param {ee.Image} tempImg - Temperature image in Kelvin
  * @param {ee.Image} rhImg - Relative Humidity image in %
  * @returns {ee.Image} Heat Index image in °C
  */
  var computeHeatIndex = function(tempImg, rhImg) {
    var tempF = tempImg.subtract(273.15).multiply(9/5).add(32);
    
    return ee.Image().expression(
      " -42.379 + 2.04901523*T + 10.14333127*RH" +
      " - 0.22475541*T*RH - 0.00683783*T**2" +
      " - 0.05481717*RH**2 + 0.00122874*T**2*RH" +
      " + 0.00085282*T*RH**2 - 0.00000199*T**2*RH**2", {
        'T': tempF,
        'RH': rhImg
      }).divide(1.8).add(17.2222);
  };

  var heat_index = computeHeatIndex(temp, humidity).rename('heat_index');

  var windSpeed = era.filterDate(START_DATE, END_DATE)
    .select(['u_component_of_wind_10m', 'v_component_of_wind_10m'])
    .map(function(img) {
      return img.expression(
        "sqrt(u**2 + v**2)", {
          'u': img.select('u_component_of_wind_10m'),
          'v': img.select('v_component_of_wind_10m')
        }).rename('wind_speed_10m');
    });
    
    /**
  * Calculate Wind Chill Temperature
  * @param {ee.Image} tempImg - Temperature image in Kelvin
  * @param {ee.Image} windImg - Wind speed image in m/s
  * @returns {ee.Image} Wind Chill image in °C
  */
  var computeWindChill = function(tempImg, windImg) {
    var tempC = tempImg.subtract(273.15);
    var windKmh = windImg.multiply(3.6);
    
    return ee.Image().expression(
      "13.12 + 0.6215*T - 11.37*V**0.16 + 0.3965*T*V**0.16", {
        'T': tempC,
        'V': windKmh
      });
  };

  var wind_chill = computeWindChill(temp, windSpeed.mean()).rename('wind_chill')
    
    

  // Данные о почве
  var soilPH = ee.Image("OpenLandMap/SOL/SOL_PH-H2O_USDA-4C1A2A_M/v02")
                .select('b0').rename('soil_pH');
  var SoilCarb = SoilCarb;
  var soilOC = SoilCarb.select('b0').rename('soil_organic_C');
                
  var SoilText = SoilText2;
  var soil_texture = SoilText
                .select('b0')
                .rename('soil_texture');      
                
  // Soil Quality index
  var computeSoilQualityIndex = function() {
    return ee.Image().expression(
      "(b0 * 0.3) + (b10 * 0.4) + (b30 * 0.3) + (org_c * 0.5)", {
        'b0': SoilText.select('b0'), // Sand
        'b10': SoilText.select('b10'), // Silt
        'b30': SoilText.select('b30'), // Clay
        'org_c': SoilCarb.select('b0') // Organic carbon
      })
      .rename('soil_quality_index');
  };

  var soil_quality = computeSoilQualityIndex();

  // Данные о NDVI
  var ndviCol = ee.ImageCollection("MODIS/MCD43A4_006_NDVI")
                .filterDate(START_DATE, END_DATE)
                .select('NDVI');
  var meanNDVI = ndviCol.mean().rename('NDVI_mean');

  var modis_brdf = modis_brdf;

  /**
  * Calculate Leaf Area Index (LAI) from MODIS BRDF
  * @returns {ee.Image} Leaf Area Index (0-10)
  */
  var computeLAI = function() {
    var modis = modis_brdf
      .filterDate(START_DATE, END_DATE)
      .select(['Nadir_Reflectance_Band1', 'Nadir_Reflectance_Band2'])
      .mean();
    
    var ndvi = modis.normalizedDifference(['Nadir_Reflectance_Band1', 'Nadir_Reflectance_Band2'])
      .rename('ndvi');
    
    return ee.Image().expression(
      "3.618 * ndvi - 0.118", {
        'ndvi': ndvi.clamp(0.1, 0.9)
      }).clamp(0, 10)
      .rename('lai');
  };

  var LAI = computeLAI();
  var slope = ee.Terrain.slope(elevation).rename('slope_deg');

  // Данные о пожарах и засухах

  var nlcd2016 = ee.ImageCollection("projects/sat-io/open-datasets/USGS/ANNUAL_NLCD/LANDCOVER")
    .filterDate(START_DATE, END_DATE)
    .mosaic()
    .select('b1');

  var shrublandPercentage = nlcd2016.eq(52) // 52 = Shrubland class
    .rename('shrubland_mask')
    .reduceRegions({
      collection: grid,
      reducer: ee.Reducer.mean(),
      scale: 500
    }).map(function(feat) {
      return feat.set('pct_shrubland', feat.get('shrubland_mask'));
    });

  var treeCover = ee.Image('USGS/NLCD_RELEASES/2016_REL/2016')
    .select('percent_tree_cover')
    .rename('pct_tree_cover');

  var fuelFeatures = shrublandPercentage.map(function(feat) {
    var shrub = feat.getNumber('shrubland_mask');
    shrub = ee.Number(ee.Algorithms.If(shrub, shrub, 0));

    var tree = treeCover.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: feat.geometry(),
    scale: 500
  }).getNumber('pct_tree_cover');
    tree = ee.Algorithms.If(tree, tree, 0);


    return feat.set({
      'pct_tree_cover': tree,
      'fuel_load': shrub.multiply(0.7).add(tree)
    });
  });

  var fuelLoadImage = fuelFeatures
    .reduceToImage({
      properties: ['fuel_load'],
      reducer: ee.Reducer.first()
    }).rename('fuel_load');

  var treeCoverImage = fuelFeatures
    .reduceToImage({
      properties: ['pct_tree_cover'],
      reducer: ee.Reducer.first()
    }).rename('pct_tree_cover');

  var shrublandImage = fuelFeatures
    .reduceToImage({
      properties: ['pct_shrubland'],
      reducer: ee.Reducer.first()
    }).rename('pct_shrubland');

  var modis = ee.ImageCollection('MODIS/006/MOD09GA')
    .filterDate(START_DATE, END_DATE)
    .select(['sur_refl_b02', 'sur_refl_b06']);

  var ndmi = modis.map(function(img) {
    return img.normalizedDifference(['sur_refl_b02', 'sur_refl_b06'])
      .rename('NDMI');
  }).mean().rename('NDMI_mean');

  // Drought Index (EDDI - Evaporative Demand Drought Index)
  var eddi = ee.ImageCollection("GRIDMET/DROUGHT")
    .filterDate(START_DATE, END_DATE)
    .select('eddi1y')
    .mean()
    .rename('EDDI');

  // Fire Weather Index (using modified Canadian FWI components)
  var calculateFWI = function(tempC, rh, wind, precip) {
    // Fine Fuel Moisture Code (FFMC)
    var ffmc = ee.Image().expression(
      "59.5 * (1 - exp(-0.05 * precip)) + (0.36 * tempC) + (0.0012 * rh**2)", {
        precip: precip,
        tempC: tempC,
        rh: rh
    }).rename('FFMC');

    // Duff Moisture Code (DMC)
    var dmc = ee.Image().expression(
      "0.92 * precip - 1.27 + (0.032 * tempC**2) - (0.006 * rh * tempC)", {
        precip: precip,
        tempC: tempC,
        rh: rh
    }).rename('DMC');

    return ffmc.addBands(dmc);
  };

  var fwiComponents = calculateFWI(
    temp.subtract(273.15),
    humidity,
    windSpeed.mean(),
    precip.multiply(1000)
  );

  // История о пожарах
  var fireHistory = ee.ImageCollection('MODIS/006/MCD64A1')
    .filter(ee.Filter.date('2010-01-01', END_DATE))
    .select('BurnDate');

  var fireFrequency = fireHistory.map(function(img) {
    return img.gt(0);
  }).sum().rename('fire_frequency');

  // Fuel Load (NLCD Tree Cover + Shrubland)
  var fuelLoad = nlcd2016.expression(
    "tree_cover + (shrubland * 0.7)", {
      tree_cover: nlcd2016.select('percent_tree_cover'),
      shrubland: nlcd2016.select('percent_shrubland')
  }).rename('fuel_load');

  // Топографический индекс распространения пожаров
  var aspect = ee.Terrain.aspect(elevation);
  var topographicIndex = slope.expression(
    "slope * (1 + cos(aspect))", {
      slope: slope,
      aspect: aspect
  }).rename('topo_index');

  // Данные о заморозках
  var frostStartMonth = 1;
  var frostEndMonth = 12;

  // Количество дней с минимальной температурой <0
  var tempDaily = ee.ImageCollection("ECMWF/ERA5_LAND/DAILY_AGGR")
    .filterDate(START_DATE, END_DATE)
    .select('temperature_2m_min');

  var frostDays = tempDaily.map(function(img) {
    var tMin = img.subtract(273.15);
    return tMin.lt(0).rename('frost_mask');
  }).sum().rename('frost_days');

  // Первые / последние заморозки
  var frostDates = tempDaily.map(function(img) {
    var tMin = img.subtract(273.15);
    var date = ee.Date(img.get('system:time_start'));
    var doy = date.getRelative('day', 'year');
    return tMin.lt(0)
      .multiply(doy)
      .toInt()
      .rename('frost_doy');
  });

  var getFrostDOY = function(img) {
    var tMin = img.select('temperature_2m_min').subtract(273.15);
    var frostDay = tMin.lt(0);
    var doy = img.date().getRelative('day', 'year');
    return frostDay.multiply(doy).add(frostDay.not().multiply(366)).toInt().rename('frost_doy');
  };

  var springFrost = tempDaily
    .filter(ee.Filter.calendarRange(3, 5, 'month'))
    .map(getFrostDOY);

    var lastSpringFrost = springFrost.max()
    .where(ee.Image(366).eq(springFrost.max()), 0)
    .clamp(60, 151)
    .rename('last_spring_frost')
    
  var fallFrost = tempDaily
    .filter(ee.Filter.calendarRange(9, 11, 'month'))
    .map(getFrostDOY);

  var firstFallFrost = fallFrost
    .reduce(ee.Reducer.min())
    .rename('first_fall_frost');
    
  // Продолжительность сезона от последних весенних заморозков до первых осенних
  var growingSeason = firstFallFrost
    .subtract(lastSpringFrost)
    .rename('growing_season_days');

  // Заморозки весной
  var springFrost = tempDaily.filter(ee.Filter.calendarRange(3, 5, 'month'))
    .map(function(img) {
      return img.subtract(273.15).lt(0);
    }).sum().rename('spring_frost_days');

  // Заморозки осенью
  var fallFrost = tempDaily.filter(ee.Filter.calendarRange(9, 11, 'month'))
    .map(function(img) {
      return img.subtract(273.15).lt(0);
    }).sum().rename('fall_frost_days');

  // Объединяем все параметры
  var featureStack = temp
      .addBands(dewpoint)
      .addBands(precip)
      .addBands(humidity)
      .addBands(heat_index)
      .addBands(wind_chill)
      .addBands(soilPH)
      .addBands(soilOC)
      .addBands(soil_texture)
      .addBands(soil_quality)
      .addBands(BFI)
      .addBands(LAI)
      .addBands(meanNDVI)
      .addBands(slope);

  var wildfireFeatures = fwiComponents
    .addBands(treeCoverImage)
    .addBands(shrublandImage)
    .addBands(fuelLoadImage)
    .addBands(ndmi)
    .addBands(eddi)
    .addBands(fireFrequency)
    .addBands(topographicIndex);
    
  var frostFeatures = ee.Image.cat([
    frostDays,
    lastSpringFrost,
    firstFallFrost,
    growingSeason,
    springFrost,
    fallFrost
  ]).reproject(proj);

  var fullFeatureStack = featureStack
    .addBands(wildfireFeatures)
    .addBands(frostFeatures);

  fullFeatureStack = fullFeatureStack.reproject({
    crs: proj,
    scale: cellSize
  });

  var featureStack = fullFeatureStack;

  featureStack = fullFeatureStack.updateMask(cornFields).clip(counties);
  
  var CountiesStats = featureStack.reduceRegions({
  collection: countiesWithBFI,
  reducer: ee.Reducer.mean(),
  scale: 500,
  crs: proj,
  tileScale: 16
});

var propertiesToKeep = [
  'GEOID', 'DMC', 'EDDI', 'FFMC', 'NDMI_mean', 'NDVI_mean',
  'ann_dewpoint', 'ann_humidity', 'ann_precip', 'ann_temp',
  'bfi', 'fall_frost_days', 'fire_frequency', 'first_fall_frost',
  'frost_days', 'fuel_load', 'growing_season_days', 'heat_index',
  'lai', 'last_spring_frost', 'pct_shrubland', 'pct_tree_cover',
  'slope_deg', 'soil_organic_C', 'soil_pH', 'soil_quality_index',
  'soil_texture', 'spring_frost_days', 'topo_index', 'wind_chill'
];

// Экспортируем
Export.table.toDrive({
  collection: CountiesStats.select(propertiesToKeep),
  description: 'CountiesStats',
  fileFormat: 'CSV',
  fileNamePrefix: 'CountiesStats'
});

