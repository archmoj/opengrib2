// adapt GRIB2CLASS from grib2_solarchvision processing/java to JavaScript

'use strict';

function jpx_decode(data) {
    var t0 = performance.now();
    var jpxImage = new JpxImage();
    jpxImage.parse(data);
    var t1 = performance.now();
    var image = {
        length : data.length,
        sx :  jpxImage.width,
        sy :  jpxImage.height,
        nbChannels : jpxImage.componentsCount,
        perf_timetodecode : t1 - t0,
        pixelData : jpxImage.tiles[0].items
    };

    return image;
}

var fs = require('fs');
function saveBytes(filename, bytes) {
  // fs.writeFileSync(filename, bytes);
}

function nf0(number) {
  return Math.round(number);
}

var /* boolean */ log = false;

var asciiTable = ["NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL", "BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI", "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB", "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US"];

function println(/* String */ a, /* optional String */ b) {
  var s =
    (a === undefined) ? '' :
    (b === undefined) ? a : a + ' ' + b;
  // console.log(s);
  // process.stdout.write(s + '\n');
}

function print(/* char */ c) {
  // console.log(c); // Change me! For the moment this prints with this new line!
  // process.stdout.write(c);
}

function /* void */ cout(/* int */ c) {
  if (!log) return;
  if (c > 31) print(c);
  else {
    print("[" + asciiTable[c] + "]");
    //print("_");
  }
}

function /* void */ sout(/* String */ a) {
  if (log) println(a);
}

function /* int */ U_NUMx2(/* int */ m2, /* int */ m1) {
  return ((m2 << 8) + m1);
}

function /* int */ S_NUMx2(/* int */ m2, /* int */ m1) {

  var /* long */ v = 0;

  if (m2 < 128) {
    v = (m2 << 8) + m1;
  }
  else {
    m2 -= 128;
    v = (m2 << 8) + m1;
    v *= -1;
  }

  return /* (int) */ v;
}

function /* int */ U_NUMx4(/* int */ m4, /* int */  m3, /* int */  m2, /* int */  m1) {
  return ((m4 << 24) + (m3 << 16) + (m2 << 8) + m1);
}

function /* int */ S_NUMx4(/* int */ m4, /* int */ m3, /* int */m2, /* int */ m1) {
  var /* long */ v = 0;

  if (m4 < 128) {
    v = ((m4 << 24) + (m3 << 16) + (m2 << 8) + m1);
  }
  else {
    m4 -= 128;
    v = ((m4 << 24) + (m3 << 16) + (m2 << 8) + m1);
    v *= -1;
  }

  return /* (int) */ v;
}

function /* long */ U_NUMx8(/* int */ m8, /* int */ m7, /* int */ m6, /* int */ m5, /* int */ m4, /* int */ m3, /* int */ m2, /* int */ m1) {

  return (m8 << 56) + (m7 << 48) + (m6 << 40) + (m5 << 32) + (m4 << 24) + (m3 << 16) + (m2 << 8) + m1;
}

function /* int */ U_NUMxI(/* int[] */ m) { // note: follows reverse rule as this: int m[0], int m[1], int m[2] ...

  // println(m);

  var /* long */ v = 0;

  var len = m.length;
  for (var i = 0; i < len; i++) {
    v += m[i] << (len - 1 - i);
  }

  // println(v);

  return /* (int) */ v;
}

function /* int */ S_NUMxI(/* int[] */ m) { // note: follows reverse rule as this: int m[0], int m[1], int m[2] ...

  // println(m);

  var /* long */ v = 0;
  var v_sign = 1;

  if (m[0] < 1) {
    v += m[0] << (m.length - 1);
  }
  else {
    v += (m[0] - 1) << (m.length - 1);
    v_sign = -1;
  }

  for (var i = 1; i < m.length; i++) {
    v += m[i] << (m.length - 1 - i);
  }

  v *= v_sign;

  // println(v);

  return /* (int) */ v;
}

function /* int */ getNthBit(/* Byte */ valByte, /* int */ posBit) {
  var valInt = valByte >> (8 - (posBit + 1)) & 0x0001;

  return /* (int) */ valInt;
}


function hex(byte) {
  return Buffer.from([byte]).toString('hex').toUpperCase();
}

function binary(uint, n) {
  var s = uint.toString(2);
  var len = s.length;
  var zeros = '';
  for (var i = 0; i < n - len; i++) {
    zeros += '0';
  }

  return (zeros + s).substring(0, n);
}

function /* String */ integerToBinaryString(/* int */ n) {
  return n.toString(2);
}

function /* String */ IntToBinary32(/* int */ n) {
  var i;
  var s1 = integerToBinaryString(n);
  var len = s1.length;

  var s2 = "";
  for (i = 0; i < 32 - len; i++) {
    s2 += "0";
  }
  for (i = 0; i < len; i++) {
    s2 += s1.substring(i, i + 1);
  }

  return s2;
}

function /* float */ IEEE32(/* String */ s) {
  var /* float */ v_sign = Math.pow(-1, parseInt(s.substring(0, 1), 2));
  //println("v_sign", v_sign);

  var /* float */ v_exponent = parseInt(s.substring(1, 9), 2) - 127;
  //println("v_exponent", v_exponent);

  var /* float */ v_fraction = 0;
  for (var i = 0; i < 23; i++) {
    var q = parseInt(s.substring(9 + i, 10 + i), 2);
    v_fraction += q * Math.pow(2, -(i + 1));
  }
  v_fraction += 1;
  //println("v_fraction", v_fraction);

  return v_sign * v_fraction * Math.pow(2, v_exponent);
}


module.exports = function /* class */ GRIB2CLASS(DATA, opts) {
  var TempFolder = opts.TempFolder;
  var OutputFolder = opts.OutputFolder;
  var Grib2Folder = TempFolder + "grib2/";
  var Jpeg2000Folder = TempFolder + "jp2/";


  this. /* String */ ParameterNameAndUnit = null;
  this. /* String[] */ DataTitles = [];
  this. /* float[][] */ DataValues = null;
  this. /* boolean */ DataAllocated = false;

  this. /* int */ DisciplineOfProcessedData = 0;
  this. /* long */ LengthOfMessage = 0;
  this. /* int */ IdentificationOfCentre = 0;
  this. /* int */ IdentificationOfSubCentre = 0;
  this. /* int */ MasterTablesVersionNumber = 0;
  this. /* int */ LocalTablesVersionNumber = 0;
  this. /* int */ SignificanceOfReferenceTime = 0;
  this. /* int */ Year = null;
  this. /* int */ Month = null;
  this. /* int */ Day = null;
  this. /* int */ Hour = null;
  this. /* int */ Minute = null;
  this. /* int */ Second = null;
  this. /* int */ ProductionStatusOfData = 0;
  this. /* int */ TypeOfData = 0;

  this. /* int */ TypeOfProjection = 0;

  this. /* int */ Np = 0;
  this. /* int */ Nx = 0;
  this. /* int */ Ny = 0;

  this. /* int */ ResolutionAndComponentFlags = 0;

  this. /* float */ La1 = -90;
  this. /* float */ Lo1 = -180;
  this. /* float */ La2 = 90;
  this. /* float */ Lo2 = 180;

  this. /* float */ LaD = 0;
  this. /* float */ LoV = 0;
  this. /* float */ Dx = 1;
  this. /* float */ Dy = 1;

  this. /* float */ FirstLatIn = 0;
  this. /* float */ SecondLatIn = 0;
  this. /* float */ SouthLat = 0;
  this. /* float */ SouthLon = 0;
  this. /* float */ Rotation = 0;

  this. /* int */ PCF = 0;

  this. /* int */ ScanX = 0;
  this. /* int */ ScanY = 0;

  this. /* String */ Flag_BitNumbers = "00000000";
  this. /* int */ ScanningMode = 0;
  this. /* String */ Mode_BitNumbers = "00000000";

  this. /* int */ NumberOfCoordinateValuesAfterTemplate = 0;
  this. /* int */ ProductDefinitionTemplateNumber = 0;
  this. /* int */ CategoryOfParametersByProductDiscipline = 0;
  this. /* int */ ParameterNumberByProductDisciplineAndParameterCategory = 0;
  this. /* int */ IndicatorOfUnitOfTimeRange = 0;
  this. /* int */ ForecastTimeInDefinedUnits = 0;

  this. /* float */ ForecastConvertedTime = null;

  this. /* int */ TypeOfFirstFixedSurface = 0;
  this. /* int */ NumberOfDataPoints = 0;
  this. /* int */ DataRepresentationTemplateNumber = 0;

  this. /* float */ ReferenceValue = null;
  this. /* int */ BinaryScaleFactor = null;
  this. /* int */ DecimalScaleFactor = null;
  this. /* int */ NumberOfBitsUsedForEachPackedValue = null;

  this. /* int[] */ NullBitmapFlags = null;

  this. /* byte[] */ fileBytes = [];
  var /* int */ nPointer;

  this. /* void */ printMore = function (/* int */ startN, /* int */ displayMORE) {
    for (var i = 0; i < displayMORE; i++) {
      cout(this.fileBytes[startN + i]);
    }
    println();

    for (var i = 0; i < displayMORE; i++) {
      print("(" + hex(this.fileBytes[startN + i], 2) + ")");
    }
    println();

    for (var i = 0; i < displayMORE; i++) {
      print("[" + this.fileBytes[startN + i] + "]");
    }
    println();
  };

  this. /* int[] */ getGrib2Section = function (/* int */ SectionNumber) {
    println("-----------------------------");

    print("Section:\t");
    println(SectionNumber);

    var /* int */ nFirstBytes = 6;
    if (SectionNumber === 8) nFirstBytes = 4;

    var /* int[] */ SectionNumbers = new Int32Array(nFirstBytes);
    SectionNumbers[0] = 0;

    for (var j = 1; j < nFirstBytes; j += 1) {
      var c = this.fileBytes[nPointer + j];
      if (c < 0) c += 256;

      SectionNumbers[j] = c;

      cout(c);
    }
    println();

    var /* int */ lengthOfSection = -1;
    if (SectionNumber === 0) lengthOfSection = 16;
    else if (SectionNumber === 8) lengthOfSection = 4;
    else lengthOfSection = U_NUMx4(SectionNumbers[1], SectionNumbers[2], SectionNumbers[3], SectionNumbers[4]);

    var /* int */ new_SectionNumber = -1;
    if (SectionNumber === 0) new_SectionNumber = 0;
    else if (SectionNumber === 8) new_SectionNumber = 8;
    else new_SectionNumber = SectionNumbers[5];

    if (new_SectionNumber === SectionNumber) {
      SectionNumbers = new Int32Array(1 + lengthOfSection);
      SectionNumbers[0] = 0;

      for (var j = 1; j <= lengthOfSection; j += 1) {
        var /* int */ c = this.fileBytes[nPointer + j];
        if (c < 0) c += 256;

        SectionNumbers[j] = c;

        cout(c);

      }
      println();
    }
    else {
      println();
      println("Not available section", SectionNumber);

      lengthOfSection = 0;

      SectionNumbers = new Int32Array(1);
      SectionNumbers[0] = 0;
    }

    for (var j = 1; j < SectionNumbers.length; j += 1) {
      //print("(" + SectionNumbers[j] +  ")");
      //print("(" + hex(SectionNumbers[j], 2) +  ")");
    }
    //println();

    print("Length of section:\t");
    println(lengthOfSection);

    nPointer += lengthOfSection;

    return SectionNumbers;
  };

  this. /* void */ readGrib2Members = function (/* int */ numberOfMembers) {
    var /* const int */ GridDEF_NumberOfDataPoints = 7;
    var /* const int */ GridDEF_NumberOfPointsAlongTheXaxis = 31;
    var /* const int */ GridDEF_NumberOfPointsAlongTheYaxis = 35;

    var /* const int */ GridDEF_LatLon_LatitudeOfFirstGridPoint = 47;
    var /* const int */ GridDEF_LatLon_LongitudeOfFirstGridPoint = 51;
    var /* const int */ GridDEF_LatLon_ResolutionAndComponentFlags = 55;
    var /* const int */ GridDEF_LatLon_LatitudeOfLastGridPoint = 56;
    var /* const int */ GridDEF_LatLon_LongitudeOfLastGridPoint = 60;
    // for Rotated latitude/longitude :
    var /* const int */ GridDEF_LatLon_SouthPoleLatitude = 73;
    var /* const int */ GridDEF_LatLon_SouthPoleLongitude = 77;
    var /* const int */ GridDEF_LatLon_RotationOfProjection = 81;

    var /* const int */ GridDEF_Polar_LatitudeOfFirstGridPoint = 39;
    var /* const int */ GridDEF_Polar_LongitudeOfFirstGridPoint = 43;
    var /* const int */ GridDEF_Polar_ResolutionAndComponentFlags = 47;
    var /* const int */ GridDEF_Polar_DeclinationOfTheGrid = 48;
    var /* const int */ GridDEF_Polar_OrientationOfTheGrid = 52;
    var /* const int */ GridDEF_Polar_XDirectionGridLength = 56;
    var /* const int */ GridDEF_Polar_YDirectionGridLength = 60;
    var /* const int */ GridDEF_Polar_ProjectionCenterFlag = 64;

    var /* const int */ GridDEF_Lambert_LatitudeOfFirstGridPoint = 39;
    var /* const int */ GridDEF_Lambert_LongitudeOfFirstGridPoint = 43;
    var /* const int */ GridDEF_Lambert_ResolutionAndComponentFlags = 47;
    var /* const int */ GridDEF_Lambert_DeclinationOfTheGrid = 48;
    var /* const int */ GridDEF_Lambert_OrientationOfTheGrid = 52;
    var /* const int */ GridDEF_Lambert_XDirectionGridLength = 56;
    var /* const int */ GridDEF_Lambert_YDirectionGridLength = 60;
    var /* const int */ GridDEF_Lambert_ProjectionCenterFlag = 64;
    var /* const int */ GridDEF_Lambert_1stLatitudeIn = 66;
    var /* const int */ GridDEF_Lambert_2ndLatitudeIn = 70;
    var /* const int */ GridDEF_Lambert_SouthPoleLatitude = 74;
    var /* const int */ GridDEF_Lambert_SouthPoleLongitude = 78;

    var /* int */ GridDEF_ScanningMode = 72;

    var /* int */ ComplexPacking_GroupSplittingMethodUsed = 0;
    var /* int */ ComplexPacking_MissingValueManagementUsed = 0;
    var /* float */ ComplexPacking_PrimaryMissingValueSubstitute = 0.0;
    var /* float */ ComplexPacking_SecondaryMissingValueSubstitute = 0.0;
    var /* int */ ComplexPacking_NumberOfGroupsOfDataValues = 0;
    var /* int */ ComplexPacking_ReferenceForGroupWidths = 0;
    var /* int */ ComplexPacking_NumberOfBitsUsedForGroupWidths = 0;
    var /* int */ ComplexPacking_ReferenceForGroupLengths = 0;
    var /* int */ ComplexPacking_LengthIncrementForTheGroupLengths = 0;
    var /* int */ ComplexPacking_TrueLengthOfLastGroup = 0;
    var /* int */ ComplexPacking_NumberOfBitsUsedForTheScaledGroupLengths = 0;
    var /* int */ ComplexPacking_OrderOfSpatialDifferencing = 0;
    var /* int */ ComplexPacking_NumberOfExtraOctetsRequiredInDataSection = 0;

    var /* int */ Bitmap_Indicator = 0;
    var /* int */ Bitmap_beginPointer = 0;
    var /* int */ Bitmap_endPointer = 0;
    var /* int */ Bitmap_FileLength = 0;
    var Bitmap_FileName = "";

    var /* int */ JPEG2000_TypeOfOriginalFieldValues = 0;
    var /* int */ JPEG2000_TypeOfCompression = 0;
    var /* int */ JPEG2000_TargetCompressionRatio = 0;
    var /* int */ JPEG2000_Lsiz = 0;
    var /* int */ JPEG2000_Rsiz = 0;
    var /* int */ JPEG2000_Xsiz = 0;
    var /* int */ JPEG2000_Ysiz = 0;
    var /* int */ JPEG2000_XOsiz = 0;
    var /* int */ JPEG2000_YOsiz = 0;
    var /* int */ JPEG2000_XTsiz = 0;
    var /* int */ JPEG2000_YTsiz = 0;
    var /* int */ JPEG2000_XTOsiz = 0;
    var /* int */ JPEG2000_YTOsiz = 0;
    var /* int */ JPEG2000_Csiz = 0;
    var /* int */ JPEG2000_Ssiz = 0;
    var /* int */ JPEG2000_XRsiz = 0;
    var /* int */ JPEG2000_YRsiz = 0;
    var /* int */ JPEG2000_Lcom = 0;
    var /* int */ JPEG2000_Rcom = 0;
    var /* int */ JPEG2000_Lcod = 0;
    var /* int */ JPEG2000_Scod = 0;
    var /* int */ JPEG2000_SGcod_ProgressionOrder = 0;
    var /* int */ JPEG2000_SGcod_NumberOfLayers = 0;
    var /* int */ JPEG2000_SGcod_MultipleComponentTransformation = 0;
    var /* int */ JPEG2000_SPcod_NumberOfDecompositionLevels = 0;
    var /* int */ JPEG2000_SPcod_CodeBlockWidth = 0;
    var /* int */ JPEG2000_SPcod_CodeBlockHeight = 0;
    var /* int */ JPEG2000_SPcod_CodeBlockStyle = 0;
    var /* int */ JPEG2000_SPcod_Transformation = 0;
    var /* int */ JPEG2000_Lqcd = 0;
    var /* int */ JPEG2000_Sqcd = 0;
    var /* int */ JPEG2000_Lsot = 0;
    var /* int */ JPEG2000_Isot = 0;
    var /* int */ JPEG2000_Psot = 0;
    var /* int */ JPEG2000_TPsot = 0;
    var /* int */ JPEG2000_TNsot = 0;

    nPointer = -1;

    for (var memberID = 0; memberID < numberOfMembers; memberID += 1) {
      var /* int[] */ SectionNumbers = this.getGrib2Section(0); // Section 0: Indicator Section

      if (SectionNumbers.length > 1) {
        print("Discipline of processed data:\t");
        this.DisciplineOfProcessedData = SectionNumbers[7];
        switch (this.DisciplineOfProcessedData) {
          case 0: println("Meteorological products"); break;
          case 1: println("Hydrological products"); break;
          case 2: println("Land surface products"); break;
          case 3: println("Space products"); break;
          case 4: println("Space Weather Products "); break;
          case 10: println("Oceanographic products"); break;
          case 255: println("Missing"); break;
          default: println(this.DisciplineOfProcessedData); break;
        }

        print("Length of message:\t");
        this.LengthOfMessage = U_NUMx8(SectionNumbers[9], SectionNumbers[10], SectionNumbers[11], SectionNumbers[12], SectionNumbers[13], SectionNumbers[14], SectionNumbers[15], SectionNumbers[16]);
        println(this.LengthOfMessage);
      }

      SectionNumbers = this.getGrib2Section(1); // Section 1: Identification Section

      if (SectionNumbers.length > 1) {
        print("Identification of originating/generating centre: ");
        this.IdentificationOfCentre = U_NUMx2(SectionNumbers[6], SectionNumbers[7]);
        switch (this.IdentificationOfCentre) {
          case 0: println("WMO Secretariat"); break;
          case 1: println("Melbourne"); break;
          case 2: println("Melbourne"); break;
          case 4: println("Moscow"); break;
          case 5: println("Moscow"); break;
          case 7: println("US National Weather Service - National Centres for Environmental Prediction (NCEP)"); break;
          case 8: println("US National Weather Service Telecommunications Gateway (NWSTG)"); break;
          case 9: println("US National Weather Service - Other"); break;
          case 10: println("Cairo (RSMC)"); break;
          case 12: println("Dakar (RSMC)"); break;
          case 14: println("Nairobi (RSMC)"); break;
          case 16: println("Casablanca (RSMC)"); break;
          case 17: println("Tunis (RSMC)"); break;
          case 18: println("Tunis - Casablanca (RSMC)"); break;
          case 20: println("Las Palmas"); break;
          case 21: println("Algiers (RSMC)"); break;
          case 22: println("ACMAD"); break;
          case 23: println("Mozambique (NMC)"); break;
          case 24: println("Pretoria (RSMC)"); break;
          case 25: println("La Réunion (RSMC)"); break;
          case 26: println("Khabarovsk (RSMC)"); break;
          case 28: println("New Delhi (RSMC)"); break;
          case 30: println("Novosibirsk (RSMC)"); break;
          case 32: println("Tashkent (RSMC)"); break;
          case 33: println("Jeddah (RSMC)"); break;
          case 34: println("Tokyo (RSMC), Japan Meteorological Agency"); break;
          case 36: println("Bangkok"); break;
          case 37: println("Ulaanbaatar"); break;
          case 38: println("Beijing (RSMC)"); break;
          case 40: println("Seoul"); break;
          case 41: println("Buenos Aires (RSMC)"); break;
          case 43: println("Brasilia (RSMC)"); break;
          case 45: println("Santiago"); break;
          case 46: println("Brazilian Space Agency ­ INPE"); break;
          case 47: println("Colombia (NMC)"); break;
          case 48: println("Ecuador (NMC)"); break;
          case 49: println("Peru (NMC)"); break;
          case 50: println("Venezuela (Bolivarian Republic of) (NMC)"); break;
          case 51: println("Miami (RSMC)"); break;
          case 52: println("Miami (RSMC), National Hurricane Centre"); break;
          case 53: println("Montreal (RSMC)"); break;
          case 54: println("Montreal (RSMC)"); break;
          case 55: println("San Francisco"); break;
          case 56: println("ARINC Centre"); break;
          case 57: println("US Air Force - Air Force Global Weather Central"); break;
          case 58: println("Fleet Numerical Meteorology and Oceanography Center, Monterey, CA, United States"); break;
          case 59: println("The NOAA Forecast Systems Laboratory, Boulder, CO, United States"); break;
          case 60: println("United States National Center for Atmospheric Research (NCAR)"); break;
          case 61: println("Service ARGOS - Landover"); break;
          case 62: println("US Naval Oceanographic Office"); break;
          case 63: println("International Research Institute for Climate and Society (IRI)"); break;
          case 64: println("Honolulu (RSMC)"); break;
          case 65: println("Darwin (RSMC)"); break;
          case 67: println("Melbourne (RSMC)"); break;
          case 69: println("Wellington (RSMC)"); break;
          case 71: println("Nadi (RSMC)"); break;
          case 72: println("Singapore"); break;
          case 73: println("Malaysia (NMC)"); break;
          case 74: println("UK Meteorological Office ­ Exeter (RSMC)"); break;
          case 76: println("Moscow (RSMC)"); break;
          case 78: println("Offenbach (RSMC)"); break;
          case 80: println("Rome (RSMC)"); break;
          case 82: println("Norrköping"); break;
          case 84: println("Toulouse (RSMC)"); break;
          case 85: println("Toulouse (RSMC)"); break;
          case 86: println("Helsinki"); break;
          case 87: println("Belgrade"); break;
          case 88: println("Oslo"); break;
          case 89: println("Prague"); break;
          case 90: println("Episkopi"); break;
          case 91: println("Ankara"); break;
          case 92: println("Frankfurt/Main"); break;
          case 93: println("London (WAFC)"); break;
          case 94: println("Copenhagen"); break;
          case 95: println("Rota"); break;
          case 96: println("Athens"); break;
          case 97: println("European Space Agency (ESA)"); break;
          case 98: println("European Centre for Medium-Range Weather Forecasts (ECMWF) (RSMC)"); break;
          case 99: println("De Bilt"); break;
          case 100: println("Brazzaville"); break;
          case 101: println("Abidjan"); break;
          case 102: println("Libya (NMC)"); break;
          case 103: println("Madagascar (NMC)"); break;
          case 104: println("Mauritius (NMC)"); break;
          case 105: println("Niger (NMC)"); break;
          case 106: println("Seychelles (NMC)"); break;
          case 107: println("Uganda (NMC)"); break;
          case 108: println("United Republic of Tanzania (NMC)"); break;
          case 109: println("Zimbabwe (NMC)"); break;
          case 110: println("Hong-Kong, China"); break;
          case 111: println("Afghanistan (NMC)"); break;
          case 112: println("Bahrain (NMC)"); break;
          case 113: println("Bangladesh (NMC)"); break;
          case 114: println("Bhutan (NMC)"); break;
          case 115: println("Cambodia (NMC)"); break;
          case 116: println("Democratic People's Republic of Korea (NMC)"); break;
          case 117: println("Islamic Republic of Iran (NMC)"); break;
          case 118: println("Iraq (NMC)"); break;
          case 119: println("Kazakhstan (NMC)"); break;
          case 120: println("Kuwait (NMC)"); break;
          case 121: println("Kyrgyzstan (NMC)"); break;
          case 122: println("Lao People's Democratic Republic (NMC)"); break;
          case 123: println("Macao, China"); break;
          case 124: println("Maldives (NMC)"); break;
          case 125: println("Myanmar (NMC)"); break;
          case 126: println("Nepal (NMC)"); break;
          case 127: println("Oman (NMC)"); break;
          case 128: println("Pakistan (NMC)"); break;
          case 129: println("Qatar (NMC)"); break;
          case 130: println("Yemen (NMC)"); break;
          case 131: println("Sri Lanka (NMC)"); break;
          case 132: println("Tajikistan (NMC)"); break;
          case 133: println("Turkmenistan (NMC)"); break;
          case 134: println("United Arab Emirates (NMC)"); break;
          case 135: println("Uzbekistan (NMC)"); break;
          case 136: println("Viet Nam (NMC)"); break;
          case 140: println("Bolivia (Plurinational State of) (NMC)"); break;
          case 141: println("Guyana (NMC)"); break;
          case 142: println("Paraguay (NMC)"); break;
          case 143: println("Suriname (NMC)"); break;
          case 144: println("Uruguay (NMC)"); break;
          case 145: println("French Guiana"); break;
          case 146: println("Brazilian Navy Hydrographic Centre"); break;
          case 147: println("National Commission on Space Activities (CONAE) - Argentina"); break;
          case 150: println("Antigua and Barbuda (NMC)"); break;
          case 151: println("Bahamas (NMC)"); break;
          case 152: println("Barbados (NMC)"); break;
          case 153: println("Belize (NMC)"); break;
          case 154: println("British Caribbean Territories Centre"); break;
          case 155: println("San José"); break;
          case 156: println("Cuba (NMC)"); break;
          case 157: println("Dominica (NMC)"); break;
          case 158: println("Dominican Republic (NMC)"); break;
          case 159: println("El Salvador (NMC)"); break;
          case 160: println("US NOAA/NESDIS"); break;
          case 161: println("US NOAA Office of Oceanic and Atmospheric Research"); break;
          case 162: println("Guatemala (NMC)"); break;
          case 163: println("Haiti (NMC)"); break;
          case 164: println("Honduras (NMC)"); break;
          case 165: println("Jamaica (NMC)"); break;
          case 166: println("Mexico City"); break;
          case 167: println("Curaçao and Sint Maarten (NMC)"); break;
          case 168: println("Nicaragua (NMC)"); break;
          case 169: println("Panama (NMC)"); break;
          case 170: println("Saint Lucia (NMC)"); break;
          case 171: println("Trinidad and Tobago (NMC)"); break;
          case 172: println("French Departments in RA IV"); break;
          case 173: println("US National Aeronautics and Space Administration (NASA)"); break;
          case 174: println("Integrated Science Data Management/Marine Environmental Data Service (ISDM/MEDS) - Canada"); break;
          case 175: println("University Corporation for Atmospheric Research (UCAR) - United States"); break;
          case 176: println("Cooperative Institute for Meteorological Satellite Studies (CIMSS) - United States"); break;
          case 177: println("NOAA National Ocean Service - United States"); break;
          case 190: println("Cook Islands (NMC)"); break;
          case 191: println("French Polynesia (NMC)"); break;
          case 192: println("Tonga (NMC)"); break;
          case 193: println("Vanuatu (NMC)"); break;
          case 194: println("Brunei Darussalam (NMC)"); break;
          case 195: println("Indonesia (NMC)"); break;
          case 196: println("Kiribati (NMC)"); break;
          case 197: println("Federated States of Micronesia (NMC)"); break;
          case 198: println("New Caledonia (NMC)"); break;
          case 199: println("Niue"); break;
          case 200: println("Papua New Guinea (NMC)"); break;
          case 201: println("Philippines (NMC)"); break;
          case 202: println("Samoa (NMC)"); break;
          case 203: println("Solomon Islands (NMC)"); break;
          case 204: println("National Institute of Water and Atmospheric Research (NIWA - New Zealand)"); break;
          case 210: println("Frascati (ESA/ESRIN)"); break;
          case 211: println("Lannion"); break;
          case 212: println("Lisbon"); break;
          case 213: println("Reykjavik"); break;
          case 214: println("Madrid"); break;
          case 215: println("Zurich"); break;
          case 216: println("Service ARGOS - Toulouse"); break;
          case 217: println("Bratislava"); break;
          case 218: println("Budapest"); break;
          case 219: println("Ljubljana"); break;
          case 220: println("Warsaw"); break;
          case 221: println("Zagreb"); break;
          case 222: println("Albania (NMC)"); break;
          case 223: println("Armenia (NMC)"); break;
          case 224: println("Austria (NMC)"); break;
          case 225: println("Azerbaijan (NMC)"); break;
          case 226: println("Belarus (NMC)"); break;
          case 227: println("Belgium (NMC)"); break;
          case 228: println("Bosnia and Herzegovina (NMC)"); break;
          case 229: println("Bulgaria (NMC)"); break;
          case 230: println("Cyprus (NMC)"); break;
          case 231: println("Estonia (NMC)"); break;
          case 232: println("Georgia (NMC)"); break;
          case 233: println("Dublin"); break;
          case 234: println("Israel (NMC)"); break;
          case 235: println("Jordan (NMC)"); break;
          case 236: println("Latvia (NMC)"); break;
          case 237: println("Lebanon (NMC)"); break;
          case 238: println("Lithuania (NMC)"); break;
          case 239: println("Luxembourg"); break;
          case 240: println("Malta (NMC)"); break;
          case 241: println("Monaco"); break;
          case 242: println("Romania (NMC)"); break;
          case 243: println("Syrian Arab Republic (NMC)"); break;
          case 244: println("The former Yugoslav Republic of Macedonia (NMC)"); break;
          case 245: println("Ukraine (NMC)"); break;
          case 246: println("Republic of Moldova (NMC)"); break;
          case 247: println("Operational Programme for the Exchange of weather RAdar information (OPERA) - EUMETNET"); break;
          case 248: println("Montenegro (NMC)"); break;
          case 249: println("Barcelona Dust Forecast Center"); break;
          case 250: println("COnsortium for Small scale MOdelling  (COSMO)"); break;
          case 251: println("Meteorological Cooperation on Operational NWP (MetCoOp)"); break;
          case 252: println("Max Planck Institute for Meteorology (MPI-M)"); break;
          case 254: println("EUMETSAT Operation Centre"); break;
          case 255: println("Missing"); break;
          default: println(this.IdentificationOfCentre); break;
        }

        print("Sub-centre:\t");
        this.IdentificationOfSubCentre = U_NUMx2(SectionNumbers[8], SectionNumbers[9]);
        switch (this.IdentificationOfSubCentre) {
          case 255: println("Missing"); break;
          default: println(this.IdentificationOfSubCentre); break;
        }

        print("Master Tables Version Number:\t");
        this.MasterTablesVersionNumber = SectionNumbers[10];
        switch (this.MasterTablesVersionNumber) {
          case 0: println("Experimental"); break;
          case 1: println("Version implemented on 7 November 2001"); break;
          case 2: println("Version implemented on 4 November 2003"); break;
          case 3: println("Version implemented on 2 November 2005"); break;
          case 4: println("Version implemented on 7 November 2007"); break;
          case 5: println("Version Implemented on 4 November 2009"); break;
          case 6: println("Version Implemented on 15 September 2010"); break;
          case 7: println("Version Implemented on 4 May 2011"); break;
          case 8: println("Version Implemented on 8 November 2011"); break;
          case 9: println("Version Implemented on 2 May 2012"); break;
          case 10: println("Version Implemented on 7 November 2012 "); break;
          case 11: println("Version Implemented on 8 May 2013"); break;
          case 12: println("Version Implemented on 14 November 2013"); break;
          case 13: println("Version Implemented on 7 May 2014"); break;
          case 14: println("Version Implemented on 5 November 2014"); break;
          case 15: println("Version Implemented on 6 May 2015"); break;
          case 16: println("Pre-operational to be implemented by next amendment"); break;
          case 255: println("Missing"); break;
          default: println(this.MasterTablesVersionNumber); break;
        }

        print("Local Tables Version Number:\t");
        this.LocalTablesVersionNumber = SectionNumbers[11];
        switch (this.LocalTablesVersionNumber) {
          case 0: println("Local tables not used. Only table entries and templates from the current Master table are valid."); break;
          case 255: println("Missing"); break;
          default: println(this.LocalTablesVersionNumber); break;
        }

        print("Significance of Reference Time:\t");
        this.SignificanceOfReferenceTime = SectionNumbers[12];
        switch (this.SignificanceOfReferenceTime) {
          case 0: println("Analysis"); break;
          case 1: println("Start of forecast"); break;
          case 2: println("Verifying time of forecast"); break;
          case 3: println("Observation time"); break;
          case 255: println("Missing"); break;
          default: println(this.SignificanceOfReferenceTime); break;
        }

        print("Year:\t");
        this.Year = U_NUMx2(SectionNumbers[13], SectionNumbers[14]);
        println(this.Year);

        print("Month:\t");
        this.Month = SectionNumbers[15];
        println(this.Month);

        print("Day:\t");
        this.Day = SectionNumbers[16];
        println(this.Day);

        print("Hour:\t");
        this.Hour = SectionNumbers[17];
        println(this.Hour);

        print("Minute:\t");
        this.Minute = SectionNumbers[18];
        println(this.Minute);

        print("Second:\t");
        this.Second = SectionNumbers[19];
        println(this.Second);

        print("Production status of data:\t");
        this.ProductionStatusOfData = SectionNumbers[20];
        switch (this.ProductionStatusOfData) {
          case 0: println("Operational products"); break;
          case 1: println("Operational test products"); break;
          case 2: println("Research products"); break;
          case 3: println("Re-analysis products"); break;
          case 255: println("Missing"); break;
          default: println(this.ProductionStatusOfData); break;
        }

        print("Type of data:\t");
        this.TypeOfData = SectionNumbers[20];
        switch (this.TypeOfData) {
          case 0: println("Analysis products"); break;
          case 1: println("Forecast products"); break;
          case 2: println("Analysis and forecast products"); break;
          case 3: println("Control forecast products"); break;
          case 4: println("Perturbed forecast products"); break;
          case 5: println("Control and perturbed forecast products"); break;
          case 6: println("Processed satellite observations"); break;
          case 7: println("Processed radar observations"); break;
          case 255: println("Missing"); break;
          default: println(this.TypeOfData); break;
        }
      }

      SectionNumbers = this.getGrib2Section(2); // Section 2: Local Use Section (optional)
      if (SectionNumbers.length > 1) {
      }

      SectionNumbers = this.getGrib2Section(3); // Section 3: Grid Definition Section

      if (SectionNumbers.length > 1) {
        print("Grid Definition Template Number:\t");
        this.TypeOfProjection = U_NUMx2(SectionNumbers[13], SectionNumbers[14]);
        switch (this.TypeOfProjection) {
          case 0: GridDEF_ScanningMode = 72; println("Latitude/longitude (equidistant cylindrical)"); break;
          case 1: GridDEF_ScanningMode = 72; println("Rotated latitude/longitude"); break;
          case 2: GridDEF_ScanningMode = 72; println("Stretched latitude/longitude"); break;
          case 3: GridDEF_ScanningMode = 72; println("Stretched and rotated latitude/longitude"); break;
          case 4: GridDEF_ScanningMode = 48; println("Variable resolution latitude/longitude"); break;
          case 5: GridDEF_ScanningMode = 48; println("Variable resolution rotated latitude/longitude"); break;
          case 10: GridDEF_ScanningMode = 60; println("Mercator"); break;
          case 12: GridDEF_ScanningMode = 60; println("Transverse Mercator"); break;
          case 20: GridDEF_ScanningMode = 65; println("Polar Stereographic Projection (can be north or south)"); GridDEF_ScanningMode = 65; break;
          case 30: GridDEF_ScanningMode = 65; println("Lambert conformal (can be secant, tangent, conical, or bipolar)"); break;
          case 31: GridDEF_ScanningMode = 65; println("Albers equal area"); break;
          case 40: GridDEF_ScanningMode = 72; println("Gaussian latitude/longitude"); break;
          case 41: GridDEF_ScanningMode = 72; println("Rotated Gaussian latitude/longitude"); break;
          case 42: GridDEF_ScanningMode = 72; println("Stretched Gaussian latitude/longitude"); break;
          case 43: GridDEF_ScanningMode = 72; println("Stretched and rotated Gaussian latitude/longitude"); break;
          case 50: println("Spherical harmonic coefficients"); break;
          case 51: println("Rotated spherical harmonic coefficients"); break;
          case 52: println("Stretched spherical harmonic coefficients"); break;
          case 53: println("Stretched and rotated spherical harmonic coefficients"); break;
          case 90: GridDEF_ScanningMode = 64; println("Space view perspective orthographic"); break;
          case 100: GridDEF_ScanningMode = 34; println("Triangular grid based on an icosahedron"); break;
          case 110: GridDEF_ScanningMode = 57; println("Equatorial azimuthal equidistant projection"); break;
          case 120: GridDEF_ScanningMode = 39; println("Azimuth-range projection"); break;
          case 140: GridDEF_ScanningMode = 64; println("Lambert azimuthal equal area projection"); break;
          case 204: GridDEF_ScanningMode = 72; println("Curvilinear orthogonal grids"); break;
          case 1000: println("Cross-section grid, with points equally spaced on the horizontal"); break;
          case 1100: GridDEF_ScanningMode = 51; println("Hovmöller diagram grid, with points equally spaced on the horizontal"); break;
          case 1200: println("Time section grid"); break;
          case 32768: GridDEF_ScanningMode = 72; println("Rotated latitude/longitude (arakawa staggered E-grid)"); break;
          case 32769: GridDEF_ScanningMode = 72; println("Rotated latitude/longitude (arakawa non-E staggered grid)"); break;
          case 65535: println("Missing"); break;
          default: println(this.TypeOfProjection); break;
        }

        print("Number of data points (Nx * Ny):\t");
        this.Np = U_NUMx4(SectionNumbers[GridDEF_NumberOfDataPoints], SectionNumbers[GridDEF_NumberOfDataPoints + 1], SectionNumbers[GridDEF_NumberOfDataPoints + 2], SectionNumbers[GridDEF_NumberOfDataPoints + 3]);
        println(this.Np);

        print("Number of points along the X-axis:\t");
        this.Nx = U_NUMx4(SectionNumbers[GridDEF_NumberOfPointsAlongTheXaxis], SectionNumbers[GridDEF_NumberOfPointsAlongTheXaxis + 1], SectionNumbers[GridDEF_NumberOfPointsAlongTheXaxis + 2], SectionNumbers[GridDEF_NumberOfPointsAlongTheXaxis + 3]);
        println(this.Nx);

        print("Number of points along the Y-axis:\t");
        this.Ny = U_NUMx4(SectionNumbers[GridDEF_NumberOfPointsAlongTheYaxis], SectionNumbers[GridDEF_NumberOfPointsAlongTheYaxis + 1], SectionNumbers[GridDEF_NumberOfPointsAlongTheYaxis + 2], SectionNumbers[GridDEF_NumberOfPointsAlongTheYaxis + 3]);
        println(this.Ny);

        if (this.TypeOfProjection === 0) { // Latitude/longitude

          this.ResolutionAndComponentFlags = SectionNumbers[GridDEF_LatLon_ResolutionAndComponentFlags];
          println("Resolution and component flags:\t" + this.ResolutionAndComponentFlags);

          this.La1 = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint], SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint + 3]);
          println("Latitude of first grid point:\t" + this.La1);

          this.Lo1 = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint], SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint + 3]);
          if (this.Lo1 === 180) this.Lo1 = -180;
          println("Longitude of first grid point:\t" + this.Lo1);

          this.La2 = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint], SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint + 1], SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint + 2], SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint + 3]);
          println("Latitude of last grid point:\t" + this.La2);

          this.Lo2 = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint], SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint + 1], SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint + 2], SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint + 3]);
          if (this.Lo2 < this.Lo1) this.Lo2 += 360;
          println("Longitude of last grid point:\t" + this.Lo2);

        }
        else if (this.TypeOfProjection === 1) { // Rotated latitude/longitude

          this.ResolutionAndComponentFlags = SectionNumbers[GridDEF_LatLon_ResolutionAndComponentFlags];
          println("Resolution and component flags:\t" + this.ResolutionAndComponentFlags);

          this.La1 = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint], SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_LatLon_LatitudeOfFirstGridPoint + 3]);
          println("Latitude of first grid point:\t" + this.La1);

          this.Lo1 = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint], SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_LatLon_LongitudeOfFirstGridPoint + 3]);
          if (this.Lo1 === 180) this.Lo1 = -180;
          println("Longitude of first grid point:\t" + this.Lo1);

          this.La2 = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint], SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint + 1], SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint + 2], SectionNumbers[GridDEF_LatLon_LatitudeOfLastGridPoint + 3]);
          println("Latitude of last grid point:\t" + this.La2);

          this.Lo2 = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint], SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint + 1], SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint + 2], SectionNumbers[GridDEF_LatLon_LongitudeOfLastGridPoint + 3]);
          if (this.Lo2 < this.Lo1) this.Lo2 += 360;
          println("Longitude of last grid point:\t" + this.Lo2);

          this.SouthLat = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_LatLon_SouthPoleLatitude], SectionNumbers[GridDEF_LatLon_SouthPoleLatitude + 1], SectionNumbers[GridDEF_LatLon_SouthPoleLatitude + 2], SectionNumbers[GridDEF_LatLon_SouthPoleLatitude + 3]);
          println("Latitude of the southern pole of projection:\t" + this.SouthLat);

          this.SouthLon = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_LatLon_SouthPoleLongitude], SectionNumbers[GridDEF_LatLon_SouthPoleLongitude + 1], SectionNumbers[GridDEF_LatLon_SouthPoleLongitude + 2], SectionNumbers[GridDEF_LatLon_SouthPoleLongitude + 3]);
          println("Longitude of the southern pole of projection:\t" + this.SouthLon);

          this.Rotation = S_NUMx4(SectionNumbers[GridDEF_LatLon_RotationOfProjection], SectionNumbers[GridDEF_LatLon_RotationOfProjection + 1], SectionNumbers[GridDEF_LatLon_RotationOfProjection + 2], SectionNumbers[GridDEF_LatLon_RotationOfProjection + 3]);
          println("Angle of rotation of projection:\t" + this.Rotation);

        }
        else if (this.TypeOfProjection === 20) { // Polar Stereographic Projection

          this.ResolutionAndComponentFlags = SectionNumbers[GridDEF_Polar_ResolutionAndComponentFlags];
          println("Resolution and component flags:\t" + this.ResolutionAndComponentFlags);

          this.La1 = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Polar_LatitudeOfFirstGridPoint], SectionNumbers[GridDEF_Polar_LatitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_Polar_LatitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_Polar_LatitudeOfFirstGridPoint + 3]);
          println("Latitude of first grid point:\t" + this.La1);

          this.Lo1 = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Polar_LongitudeOfFirstGridPoint], SectionNumbers[GridDEF_Polar_LongitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_Polar_LongitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_Polar_LongitudeOfFirstGridPoint + 3]);
          println("Longitude of first grid point:\t" + this.Lo1);

          this.LaD = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Polar_DeclinationOfTheGrid], SectionNumbers[GridDEF_Polar_DeclinationOfTheGrid + 1], SectionNumbers[GridDEF_Polar_DeclinationOfTheGrid + 2], SectionNumbers[GridDEF_Polar_DeclinationOfTheGrid + 3]);
          println("Latitude where Dx and Dy are specified:\t" + this.LaD);

          this.LoV = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Polar_OrientationOfTheGrid], SectionNumbers[GridDEF_Polar_OrientationOfTheGrid + 1], SectionNumbers[GridDEF_Polar_OrientationOfTheGrid + 2], SectionNumbers[GridDEF_Polar_OrientationOfTheGrid + 3]);
          println("Orientation of the grid:\t" + this.LoV);

          this.Dx = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Polar_XDirectionGridLength], SectionNumbers[GridDEF_Polar_XDirectionGridLength + 1], SectionNumbers[GridDEF_Polar_XDirectionGridLength + 2], SectionNumbers[GridDEF_Polar_XDirectionGridLength + 3]);
          println("X-direction grid length (km):\t" + this.Dx);

          this.Dy = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Polar_YDirectionGridLength], SectionNumbers[GridDEF_Polar_YDirectionGridLength + 1], SectionNumbers[GridDEF_Polar_YDirectionGridLength + 2], SectionNumbers[GridDEF_Polar_YDirectionGridLength + 3]);
          println("Y-direction grid length (km):\t" + this.Dy);

          this.PCF = SectionNumbers[GridDEF_Polar_ProjectionCenterFlag];
          println("Projection center flag:\t" + this.PCF);

        }
        else if (this.TypeOfProjection === 30) { // Lambert Conformal Projection

          this.ResolutionAndComponentFlags = SectionNumbers[GridDEF_Lambert_ResolutionAndComponentFlags];
          println("Resolution and component flags:\t" + this.ResolutionAndComponentFlags);

          this.La1 = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Lambert_LatitudeOfFirstGridPoint], SectionNumbers[GridDEF_Lambert_LatitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_Lambert_LatitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_Lambert_LatitudeOfFirstGridPoint + 3]);
          println("Latitude of first grid point:\t" + this.La1);

          this.Lo1 = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Lambert_LongitudeOfFirstGridPoint], SectionNumbers[GridDEF_Lambert_LongitudeOfFirstGridPoint + 1], SectionNumbers[GridDEF_Lambert_LongitudeOfFirstGridPoint + 2], SectionNumbers[GridDEF_Lambert_LongitudeOfFirstGridPoint + 3]);
          println("Longitude of first grid point:\t" + this.Lo1);

          this.LaD = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Lambert_DeclinationOfTheGrid], SectionNumbers[GridDEF_Lambert_DeclinationOfTheGrid + 1], SectionNumbers[GridDEF_Lambert_DeclinationOfTheGrid + 2], SectionNumbers[GridDEF_Lambert_DeclinationOfTheGrid + 3]);
          println("Latitude where Dx and Dy are specified:\t" + this.LaD);

          this.LoV = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Lambert_OrientationOfTheGrid], SectionNumbers[GridDEF_Lambert_OrientationOfTheGrid + 1], SectionNumbers[GridDEF_Lambert_OrientationOfTheGrid + 2], SectionNumbers[GridDEF_Lambert_OrientationOfTheGrid + 3]);
          println("Orientation of the grid:\t" + this.LoV);

          this.Dx = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Lambert_XDirectionGridLength], SectionNumbers[GridDEF_Lambert_XDirectionGridLength + 1], SectionNumbers[GridDEF_Lambert_XDirectionGridLength + 2], SectionNumbers[GridDEF_Lambert_XDirectionGridLength + 3]);
          println("X-direction grid length (km):\t" + this.Dx);

          this.Dy = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Lambert_YDirectionGridLength], SectionNumbers[GridDEF_Lambert_YDirectionGridLength + 1], SectionNumbers[GridDEF_Lambert_YDirectionGridLength + 2], SectionNumbers[GridDEF_Lambert_YDirectionGridLength + 3]);
          println("Y-direction grid length (km):\t" + this.Dy);

          this.PCF = SectionNumbers[GridDEF_Lambert_ProjectionCenterFlag];
          println("Projection center flag:\t" + this.PCF);

          this.FirstLatIn = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Lambert_1stLatitudeIn], SectionNumbers[GridDEF_Lambert_1stLatitudeIn + 1], SectionNumbers[GridDEF_Lambert_1stLatitudeIn + 2], SectionNumbers[GridDEF_Lambert_1stLatitudeIn + 3]);
          println("First latitude from the pole at which the secant cone cuts the sphere:\t" + this.FirstLatIn);

          this.SecondLatIn = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Lambert_2ndLatitudeIn], SectionNumbers[GridDEF_Lambert_2ndLatitudeIn + 1], SectionNumbers[GridDEF_Lambert_2ndLatitudeIn + 2], SectionNumbers[GridDEF_Lambert_2ndLatitudeIn + 3]);
          println("Second latitude from the pole at which the secant cone cuts the sphere:\t" + this.SecondLatIn);

          this.SouthLat = 0.000001 * S_NUMx4(SectionNumbers[GridDEF_Lambert_2ndLatitudeIn], SectionNumbers[GridDEF_Lambert_2ndLatitudeIn + 1], SectionNumbers[GridDEF_Lambert_2ndLatitudeIn + 2], SectionNumbers[GridDEF_Lambert_2ndLatitudeIn + 3]);
          println("Latitude of the southern pole of projection:\t" + this.SouthLat);

          this.SouthLon = 0.000001 * U_NUMx4(SectionNumbers[GridDEF_Lambert_SouthPoleLongitude], SectionNumbers[GridDEF_Lambert_SouthPoleLongitude + 1], SectionNumbers[GridDEF_Lambert_SouthPoleLongitude + 2], SectionNumbers[GridDEF_Lambert_SouthPoleLongitude + 3]);
          println("Longitude of the southern pole of projection:\t" + this.SouthLon);

        }

        print("Flag bit numbers:\n");
        this.Flag_BitNumbers = binary(this.ResolutionAndComponentFlags, 8);
        {
          if (this.Flag_BitNumbers.substring(2, 3) === "0") {
            println("\ti direction increments not given");
          }
          else {
            println("\ti direction increments given");
          }

          if (this.Flag_BitNumbers.substring(3, 4) === "0") {
            println("\tj direction increments not given");
          }
          else {
            println("\tj direction increments given");
          }

          if (this.Flag_BitNumbers.substring(4, 5) === "0") {
            println("\tResolved u- and v- components of vector quantities relative to easterly and northerly directions");
          }
          else {
            println("\tResolved u- and v- components of vector quantities relative to the defined grid in the direction of increasing x and y (or i and j) coordinates respectively");
          }
        }

        print("Scanning mode:\t");
        this.ScanningMode = SectionNumbers[GridDEF_ScanningMode];
        println(this.ScanningMode);

        this.ScanX = 1;
        this.ScanY = 1;

        print("Mode bit numbers:\n");
        this.Mode_BitNumbers = binary(this.ScanningMode, 8);
        {
          if (this.Mode_BitNumbers.substring(0, 1) === "0") {
            println("\tPoints of first row or column scan in the +i (+x) direction");
          }
          else {
            println("\tPoints of first row or column scan in the -i (-x) direction");
            this.ScanX = 0;
          }

          if (this.Mode_BitNumbers.substring(1, 2) === "0") {
            println("\tPoints of first row or column scan in the -j (-y) direction");
          }
          else {
            println("\tPoints of first row or column scan in the +j (+y) direction");
            this.ScanY = 0;
          }

          if (this.Mode_BitNumbers.substring(2, 3) === "0") {
            println("\tAdjacent points in i (x) direction are consecutive");
          }
          else {
            println("\tAdjacent points in j (y) direction is consecutive");
          }

          if (this.Mode_BitNumbers.substring(3, 4) === "0") {
            println("\tAll rows scan in the same direction");
          }
          else {
            println("\tAdjacent rows scan in opposite directions");
          }
        }
      }

      SectionNumbers = this.getGrib2Section(4); // Section 4: Product Definition Section

      if (SectionNumbers.length > 1) {
        print("Number of coordinate values after Template:\t");
        this.NumberOfCoordinateValuesAfterTemplate = U_NUMx2(SectionNumbers[6], SectionNumbers[7]);
        println(this.NumberOfCoordinateValuesAfterTemplate);

        print("Number of coordinate values after Template:\t");
        this.ProductDefinitionTemplateNumber = U_NUMx2(SectionNumbers[8], SectionNumbers[9]);
        switch (this.ProductDefinitionTemplateNumber) {
          case 0: println("Analysis or forecast at a horizontal level or in a horizontal layer at a point in time. (see Template 4.0)"); break;
          case 1: println("Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer at a point in time. (see Template 4.1)"); break;
          case 2: println("Derived forecasts based on all ensemble members at a horizontal level or in a horizontal layer at a point in time. (see Template 4.2)"); break;
          case 3: println("Derived forecasts based on a cluster of ensemble members over a rectangular area at a horizontal level or in a horizontal layer at a point in time. (see Template 4.3)"); break;
          case 4: println("Derived forecasts based on a cluster of ensemble members over a circular area at a horizontal level or in a horizontal layer at a point in time. (see Template 4.4)"); break;
          case 5: println("Probability forecasts at a horizontal level or in a horizontal layer at a point in time. (see Template 4.5)"); break;
          case 6: println("Percentile forecasts at a horizontal level or in a horizontal layer at a point in time. (see Template 4.6)"); break;
          case 7: println("Analysis or forecast error at a horizontal level or in a horizontal layer at a point in time. (see Template 4.7)"); break;
          case 8: println("Average, accumulation, extreme values or other statistically processed values at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.8)"); break;
          case 9: println("Probability forecasts at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.9)"); break;
          case 10: println("Percentile forecasts at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.10)"); break;
          case 11: println("Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.11)"); break;
          case 12: println("Derived forecasts based on all ensemble members at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.12)"); break;
          case 13: println("Derived forecasts based on a cluster of ensemble members over a rectangular area at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.13)"); break;
          case 14: println("Derived forecasts based on a cluster of ensemble members over a circular area at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.14)"); break;
          case 15: println("Average, accumulation, extreme values or other statistically-processed values over a spatial area at a horizontal level or in a horizontal layer at a point in time. (see Template 4.15)"); break;
          case 20: println("Radar product (see Template 4.20)"); break;
          case 30: println("Satellite product (see Template 4.30) NOTE:This template is deprecated. Template 4.31 should be used instead."); break;
          case 31: println("Satellite product (see Template 4.31)"); break;
          case 32: println("Analysis or forecast at a horizontal level or in a horizontal layer at a point in time for simulate (synthetic) staellite data (see Template 4.32)"); break;
          case 40: println("Analysis or forecast at a horizontal level or in a horizontal layer at a point in time for atmospheric chemical constituents. (see Template 4.40)"); break;
          case 41: println("Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer at a point in time for atmospheric chemical constituents. (see Template 4.41)"); break;
          case 42: println("Average, accumulation, and/or extreme values or other statistically processed values at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval for atmospheric chemical constituents. (see Template 4.42)"); break;
          case 43: println("Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval for atmospheric chemical constituents. (see Template 4.43)"); break;
          case 44: println("Analysis or forecast at a horizontal level or in a horizontal layer at a point in time for aerosol. (see Template 4.44)"); break;
          case 45: println("Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval for aerosol. (see Template 4.45)"); break;
          case 46: println("Average, accumulation, and/or extreme values or other statistically processed values at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval for aerosol. (see Template 4.46)"); break;
          case 47: println("Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval for aerosol. (see Template 4.47)"); break;
          case 48: println("Analysis or forecast at a horizontal level or in a horizontal layer at a point in time for aerosol. (see Template 4.48)"); break;
          case 51: println("Categorical forecast at a horizontal level or in a horizontal layer at a point in time. (see Template 4.51)"); break;
          case 91: println("Categorical forecast at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.91)"); break;
          case 254: println("CCITT IA5 character string (see Template 4.254)"); break;
          case 1000: println("Cross-section of analysis and forecast at a point in time. (see Template 4.1000)"); break;
          case 1001: println("Cross-section of averaged or otherwise statistically processed analysis or forecast over a range of time. (see Template 4.1001)"); break;
          case 1002: println("Cross-section of analysis and forecast, averaged or otherwise statistically-processed over latitude or longitude. (see Template 4.1002)"); break;
          case 1100: println("Hovmoller-type grid with no averaging or other statistical processing (see Template 4.1100)"); break;
          case 1101: println("Hovmoller-type grid with averaging or other statistical processing (see Template 4.1101)"); break;
          case 65535: println("Missing"); break;
          default: println(this.ProductDefinitionTemplateNumber); break;
        }

        print("Category of parameters by product discipline:\t");
        this.CategoryOfParametersByProductDiscipline = SectionNumbers[10];
        if (this.DisciplineOfProcessedData === 0) { // Meteorological
          switch (this.CategoryOfParametersByProductDiscipline) {
            case 0: println("Temperature"); break;
            case 1: println("Moisture"); break;
            case 2: println("Momentum"); break;
            case 3: println("Mass"); break;
            case 4: println("Short-wave Radiation"); break;
            case 5: println("Long-wave Radiation"); break;
            case 6: println("Cloud"); break;
            case 7: println("Thermodynamic Stability indices"); break;
            case 8: println("Kinematic Stability indices"); break;
            case 9: println("Temperature Probabilities"); break;
            case 10: println("Moisture Probabilities"); break;
            case 11: println("Momentum Probabilities"); break;
            case 12: println("Mass Probabilities"); break;
            case 13: println("Aerosols"); break;
            case 14: println("Trace gases (e.g., ozone, CO2)"); break;
            case 15: println("Radar"); break;
            case 16: println("Forecast Radar Imagery"); break;
            case 17: println("Electro-dynamics"); break;
            case 18: println("Nuclear/radiology"); break;
            case 19: println("Physical atmospheric properties"); break;
            case 190: println("CCITT IA5 string"); break;
            case 191: println("Miscellaneous"); break;
            case 255: println("Missing"); break;
            default: println(this.CategoryOfParametersByProductDiscipline); break;
          }
        }
        else {
          println(this.CategoryOfParametersByProductDiscipline);
        }

        print("Parameter number by product discipline and parameter category:\t");
        this.ParameterNumberByProductDisciplineAndParameterCategory = SectionNumbers[11];

        if (this.DisciplineOfProcessedData === 0) { // Meteorological
          if (this.CategoryOfParametersByProductDiscipline === 0) { // Temperature
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Temperature(K)"; break;
              case 1: this.ParameterNameAndUnit = "Virtual Temperature(K)"; break;
              case 2: this.ParameterNameAndUnit = "Potential Temperature(K)"; break;
              case 3: this.ParameterNameAndUnit = "Pseudo-Adiabatic Potential Temperature (or Equivalent Potential Temperature)(K)"; break;
              case 4: this.ParameterNameAndUnit = "Maximum Temperature*(K)"; break;
              case 5: this.ParameterNameAndUnit = "Minimum Temperature*(K)"; break;
              case 6: this.ParameterNameAndUnit = "Dew Point Temperature(K)"; break;
              case 7: this.ParameterNameAndUnit = "Dew Point Depression (or Deficit)(K)"; break;
              case 8: this.ParameterNameAndUnit = "Lapse Rate(K m-1)"; break;
              case 9: this.ParameterNameAndUnit = "Temperature Anomaly(K)"; break;
              case 10: this.ParameterNameAndUnit = "Latent Heat Net Flux(W m-2)"; break;
              case 11: this.ParameterNameAndUnit = "Sensible Heat Net Flux(W m-2)"; break;
              case 12: this.ParameterNameAndUnit = "Heat Index(K)"; break;
              case 13: this.ParameterNameAndUnit = "Wind Chill Factor(K)"; break;
              case 14: this.ParameterNameAndUnit = "Minimum Dew Point Depression*(K)"; break;
              case 15: this.ParameterNameAndUnit = "Virtual Potential Temperature(K)"; break;
              case 16: this.ParameterNameAndUnit = "Snow Phase Change Heat Flux(W m-2)"; break;
              case 17: this.ParameterNameAndUnit = "Skin Temperature(K)"; break;
              case 18: this.ParameterNameAndUnit = "Snow Temperature (top of snow)(K)"; break;
              case 19: this.ParameterNameAndUnit = "Turbulent Transfer Coefficient for Heat(Numeric)"; break;
              case 20: this.ParameterNameAndUnit = "Turbulent Diffusion Coefficient for Heat(m2s-1)"; break;
              case 192: this.ParameterNameAndUnit = "Snow Phase Change Heat Flux(W m-2)"; break;
              case 193: this.ParameterNameAndUnit = "Temperature Tendency by All Radiation(K s-1)"; break;
              case 194: this.ParameterNameAndUnit = "Relative Error Variance()"; break;
              case 195: this.ParameterNameAndUnit = "Large Scale Condensate Heating Rate(K/s)"; break;
              case 196: this.ParameterNameAndUnit = "Deep Convective Heating Rate(K/s)"; break;
              case 197: this.ParameterNameAndUnit = "Total Downward Heat Flux at Surface(W m-2)"; break;
              case 198: this.ParameterNameAndUnit = "Temperature Tendency by All Physics(K s-1)"; break;
              case 199: this.ParameterNameAndUnit = "Temperature Tendency by Non-radiation Physics(K s-1)"; break;
              case 200: this.ParameterNameAndUnit = "Standard Dev. of IR Temp. over 1x1 deg. area(K)"; break;
              case 201: this.ParameterNameAndUnit = "Shallow Convective Heating Rate(K/s)"; break;
              case 202: this.ParameterNameAndUnit = "Vertical Diffusion Heating rate(K/s)"; break;
              case 203: this.ParameterNameAndUnit = "Potential Temperature at Top of Viscous Sublayer(K)"; break;
              case 204: this.ParameterNameAndUnit = "Tropical Cyclone Heat Potential(J/m2K)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 1) { // Moisture
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Specific Humidity(kg kg-1)"; break;
              case 1: this.ParameterNameAndUnit = "Relative Humidity(%)"; break;
              case 2: this.ParameterNameAndUnit = "Humidity Mixing Ratio(kg kg-1)"; break;
              case 3: this.ParameterNameAndUnit = "Precipitable Water(kg m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Vapour Pressure(Pa)"; break;
              case 5: this.ParameterNameAndUnit = "Saturation Deficit(Pa)"; break;
              case 6: this.ParameterNameAndUnit = "Evaporation(kg m-2)"; break;
              case 7: this.ParameterNameAndUnit = "Precipitation Rate *(kg m-2 s-1)"; break;
              case 8: this.ParameterNameAndUnit = "Total Precipitation ***(kg m-2)"; break;
              case 9: this.ParameterNameAndUnit = "Large-Scale Precipitation (non-convective) ***(kg m-2)"; break;
              case 10: this.ParameterNameAndUnit = "Convective Precipitation ***(kg m-2)"; break;
              case 11: this.ParameterNameAndUnit = "Snow Depth(m)"; break;
              case 12: this.ParameterNameAndUnit = "Snowfall Rate Water Equivalent *(kg m-2 s-1)"; break;
              case 13: this.ParameterNameAndUnit = "Water Equivalent of Accumulated Snow Depth ***(kg m-2)"; break;
              case 14: this.ParameterNameAndUnit = "Convective Snow ***(kg m-2)"; break;
              case 15: this.ParameterNameAndUnit = "Large-Scale Snow ***(kg m-2)"; break;
              case 16: this.ParameterNameAndUnit = "Snow Melt(kg m-2)"; break;
              case 17: this.ParameterNameAndUnit = "Snow Age(day)"; break;
              case 18: this.ParameterNameAndUnit = "Absolute Humidity(kg m-3)"; break;
              case 19: this.ParameterNameAndUnit = "Precipitation Type(See Table 4.201)"; break;
              case 20: this.ParameterNameAndUnit = "Integrated Liquid Water(kg m-2)"; break;
              case 21: this.ParameterNameAndUnit = "Condensate(kg kg-1)"; break;
              case 22: this.ParameterNameAndUnit = "Cloud Mixing Ratio(kg kg-1)"; break;
              case 23: this.ParameterNameAndUnit = "Ice Water Mixing Ratio(kg kg-1)"; break;
              case 24: this.ParameterNameAndUnit = "Rain Mixing Ratio(kg kg-1)"; break;
              case 25: this.ParameterNameAndUnit = "Snow Mixing Ratio(kg kg-1)"; break;
              case 26: this.ParameterNameAndUnit = "Horizontal Moisture Convergence(kg kg-1 s-1)"; break;
              case 27: this.ParameterNameAndUnit = "Maximum Relative Humidity *(%)"; break;
              case 28: this.ParameterNameAndUnit = "Maximum Absolute Humidity *(kg m-3)"; break;
              case 29: this.ParameterNameAndUnit = "Total Snowfall ***(m)"; break;
              case 30: this.ParameterNameAndUnit = "Precipitable Water Category(See Table 4.202)"; break;
              case 31: this.ParameterNameAndUnit = "Hail(m)"; break;
              case 32: this.ParameterNameAndUnit = "Graupel(kg kg-1)"; break;
              case 33: this.ParameterNameAndUnit = "Categorical Rain(Code table 4.222)"; break;
              case 34: this.ParameterNameAndUnit = "Categorical Freezing Rain(Code table 4.222)"; break;
              case 35: this.ParameterNameAndUnit = "Categorical Ice Pellets(Code table 4.222)"; break;
              case 36: this.ParameterNameAndUnit = "Categorical Snow(Code table 4.222)"; break;
              case 37: this.ParameterNameAndUnit = "Convective Precipitation Rate(kg m-2 s-1)"; break;
              case 38: this.ParameterNameAndUnit = "Horizontal Moisture Divergence(kg kg-1 s-1)"; break;
              case 39: this.ParameterNameAndUnit = "Percent frozen precipitation(%)"; break;
              case 40: this.ParameterNameAndUnit = "Potential Evaporation(kg m-2)"; break;
              case 41: this.ParameterNameAndUnit = "Potential Evaporation Rate(W m-2)"; break;
              case 42: this.ParameterNameAndUnit = "Snow Cover(%)"; break;
              case 43: this.ParameterNameAndUnit = "Rain Fraction of Total Cloud Water(Proportion)"; break;
              case 44: this.ParameterNameAndUnit = "Rime Factor(Numeric)"; break;
              case 45: this.ParameterNameAndUnit = "Total Column Integrated Rain(kg m-2)"; break;
              case 46: this.ParameterNameAndUnit = "Total Column Integrated Snow(kg m-2)"; break;
              case 47: this.ParameterNameAndUnit = "Large Scale Water Precipitation (Non-Convective) ***(kg m-2)"; break;
              case 48: this.ParameterNameAndUnit = "Convective Water Precipitation ***(kg m-2)"; break;
              case 49: this.ParameterNameAndUnit = "Total Water Precipitation ***(kg m-2)"; break;
              case 50: this.ParameterNameAndUnit = "Total Snow Precipitation ***(kg m-2)"; break;
              case 51: this.ParameterNameAndUnit = "Total Column Water (Vertically integrated total water (vapour+cloud water/ice)(kg m-2)"; break;
              case 52: this.ParameterNameAndUnit = "Total Precipitation Rate **(kg m-2 s-1)"; break;
              case 53: this.ParameterNameAndUnit = "Total Snowfall Rate Water Equivalent **(kg m-2 s-1)"; break;
              case 54: this.ParameterNameAndUnit = "Large Scale Precipitation Rate(kg m-2 s-1)"; break;
              case 55: this.ParameterNameAndUnit = "Convective Snowfall Rate Water Equivalent(kg m-2 s-1)"; break;
              case 56: this.ParameterNameAndUnit = "Large Scale Snowfall Rate Water Equivalent(kg m-2 s-1)"; break;
              case 57: this.ParameterNameAndUnit = "Total Snowfall Rate(m s-1)"; break;
              case 58: this.ParameterNameAndUnit = "Convective Snowfall Rate(m s-1)"; break;
              case 59: this.ParameterNameAndUnit = "Large Scale Snowfall Rate(m s-1)"; break;
              case 60: this.ParameterNameAndUnit = "Snow Depth Water Equivalent(kg m-2)"; break;
              case 61: this.ParameterNameAndUnit = "Snow Density(kg m-3)"; break;
              case 62: this.ParameterNameAndUnit = "Snow Evaporation(kg m-2)"; break;
              case 64: this.ParameterNameAndUnit = "Total Column Integrated Water Vapour(kg m-2)"; break;
              case 65: this.ParameterNameAndUnit = "Rain Precipitation Rate(kg m-2 s-1)"; break;
              case 66: this.ParameterNameAndUnit = "Snow Precipitation Rate(kg m-2 s-1)"; break;
              case 67: this.ParameterNameAndUnit = "Freezing Rain Precipitation Rate(kg m-2 s-1)"; break;
              case 68: this.ParameterNameAndUnit = "Ice Pellets Precipitation Rate(kg m-2 s-1)"; break;
              case 69: this.ParameterNameAndUnit = "Total Column Integrate Cloud Water(kg m-2)"; break;
              case 70: this.ParameterNameAndUnit = "Total Column Integrate Cloud Ice(kg m-2)"; break;
              case 71: this.ParameterNameAndUnit = "Hail Mixing Ratio(kg kg-1)"; break;
              case 72: this.ParameterNameAndUnit = "Total Column Integrate Hail(kg m-2)"; break;
              case 73: this.ParameterNameAndUnit = "Hail Prepitation Rate(kg m-2 s-1)"; break;
              case 74: this.ParameterNameAndUnit = "Total Column Integrate Graupel(kg m-2)"; break;
              case 75: this.ParameterNameAndUnit = "Graupel (Snow Pellets) Prepitation Rate(kg m-2 s-1)"; break;
              case 76: this.ParameterNameAndUnit = "Convective Rain Rate(kg m-2 s-1)"; break;
              case 77: this.ParameterNameAndUnit = "Large Scale Rain Rate(kg m-2 s-1)"; break;
              case 78: this.ParameterNameAndUnit = "Total Column Integrate Water (All components including precipitation)(kg m-2)"; break;
              case 79: this.ParameterNameAndUnit = "Evaporation Rate(kg m-2 s-1)"; break;
              case 80: this.ParameterNameAndUnit = "Total Condensatea(kg kg-1)"; break;
              case 81: this.ParameterNameAndUnit = "Total Column-Integrate Condensate(kg m-2)"; break;
              case 82: this.ParameterNameAndUnit = "Cloud Ice Mixing Ratio(kg kg-1)"; break;
              case 83: this.ParameterNameAndUnit = "Specific Cloud Liquid Water Content(kg kg-1)"; break;
              case 84: this.ParameterNameAndUnit = "Specific Cloud Ice Water Content(kg kg-1)"; break;
              case 85: this.ParameterNameAndUnit = "Specific Rain Water Content(kg kg-1)"; break;
              case 86: this.ParameterNameAndUnit = "Specific Snow Water Content(kg kg-1)"; break;
              case 90: this.ParameterNameAndUnit = "Total Kinematic Moisture Flux(kg kg-1 m s-1)"; break;
              case 91: this.ParameterNameAndUnit = "U-component (zonal) Kinematic Moisture Flux(kg kg-1 m s-1)"; break;
              case 92: this.ParameterNameAndUnit = "V-component (meridional) Kinematic Moisture Flux(kg kg-1 m s-1)"; break;
              case 192: this.ParameterNameAndUnit = "Categorical Rain(Code table 4.222)"; break;
              case 193: this.ParameterNameAndUnit = "Categorical Freezing Rain(Code table 4.222)"; break;
              case 194: this.ParameterNameAndUnit = "Categorical Ice Pellets(Code table 4.222)"; break;
              case 195: this.ParameterNameAndUnit = "Categorical Snow(Code table 4.222)"; break;
              case 196: this.ParameterNameAndUnit = "Convective Precipitation Rate(kg m-2 s-1)"; break;
              case 197: this.ParameterNameAndUnit = "Horizontal Moisture Divergence(kg kg-1 s-1)"; break;
              case 198: this.ParameterNameAndUnit = "Minimum Relative Humidity(%)"; break;
              case 199: this.ParameterNameAndUnit = "Potential Evaporation(kg m-2)"; break;
              case 200: this.ParameterNameAndUnit = "Potential Evaporation Rate(W m-2)"; break;
              case 201: this.ParameterNameAndUnit = "Snow Cover(%)"; break;
              case 202: this.ParameterNameAndUnit = "Rain Fraction of Total Liquid Water(non-dim)"; break;
              case 203: this.ParameterNameAndUnit = "Rime Factor(non-dim)"; break;
              case 204: this.ParameterNameAndUnit = "Total Column Integrated Rain(kg m-2)"; break;
              case 205: this.ParameterNameAndUnit = "Total Column Integrated Snow(kg m-2)"; break;
              case 206: this.ParameterNameAndUnit = "Total Icing Potential Diagnostic(non-dim)"; break;
              case 207: this.ParameterNameAndUnit = "Number concentration for ice particles(non-dim)"; break;
              case 208: this.ParameterNameAndUnit = "Snow temperature(K)"; break;
              case 209: this.ParameterNameAndUnit = "Total column-integrated supercooled liquid water(kg m-2)"; break;
              case 210: this.ParameterNameAndUnit = "Total column-integrated melting ice(kg m-2)"; break;
              case 211: this.ParameterNameAndUnit = "Evaporation - Precipitation(cm/day)"; break;
              case 212: this.ParameterNameAndUnit = "Sublimation (evaporation from snow)(W m-2)"; break;
              case 213: this.ParameterNameAndUnit = "Deep Convective Moistening Rate(kg kg-1 s-1)"; break;
              case 214: this.ParameterNameAndUnit = "Shallow Convective Moistening Rate(kg kg-1 s-1)"; break;
              case 215: this.ParameterNameAndUnit = "Vertical Diffusion Moistening Rate(kg kg-1 s-1)"; break;
              case 216: this.ParameterNameAndUnit = "Condensation Pressure of Parcali Lifted From Indicate Surface(Pa)"; break;
              case 217: this.ParameterNameAndUnit = "Large scale moistening rate(kg kg-1 s-1)"; break;
              case 218: this.ParameterNameAndUnit = "Specific humidity at top of viscous sublayer(kg kg-1)"; break;
              case 219: this.ParameterNameAndUnit = "Maximum specific humidity at 2m(kg kg-1)"; break;
              case 220: this.ParameterNameAndUnit = "Minimum specific humidity at 2m(kg kg-1)"; break;
              case 221: this.ParameterNameAndUnit = "Liquid precipitation (Rainfall)(kg m-2)"; break;
              case 222: this.ParameterNameAndUnit = "Snow temperature, depth-avg(K)"; break;
              case 223: this.ParameterNameAndUnit = "Total precipitation (nearest grid point)(kg m-2)"; break;
              case 224: this.ParameterNameAndUnit = "Convective precipitation (nearest grid point)(kg m-2)"; break;
              case 225: this.ParameterNameAndUnit = "Freezing Rain(kg m-2)"; break;
              case 226: this.ParameterNameAndUnit = "Predominant Weather(Numeric (See note 1))"; break;
              case 227: this.ParameterNameAndUnit = "Frozen Rain(kg m-2)"; break;
              case 241: this.ParameterNameAndUnit = "Total Snow(kg m-2)"; break;
              case 242: this.ParameterNameAndUnit = "Relative Humidity with Respect to Precipitable Water(%)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 2) { // Momentum
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Wind Direction (from which blowing)(true)"; break;
              case 1: this.ParameterNameAndUnit = "Wind Speed(m s-1)"; break;
              case 2: this.ParameterNameAndUnit = "U-Component of Wind(m s-1)"; break;
              case 3: this.ParameterNameAndUnit = "V-Component of Wind(m s-1)"; break;
              case 4: this.ParameterNameAndUnit = "Stream Function(m2 s-1)"; break;
              case 5: this.ParameterNameAndUnit = "Velocity Potential(m2 s-1)"; break;
              case 6: this.ParameterNameAndUnit = "Montgomery Stream Function(m2 s-2)"; break;
              case 7: this.ParameterNameAndUnit = "Sigma Coordinate Vertical Velocity(s-1)"; break;
              case 8: this.ParameterNameAndUnit = "Vertical Velocity (Pressure)(Pa s-1)"; break;
              case 9: this.ParameterNameAndUnit = "Vertical Velocity (Geometric)(m s-1)"; break;
              case 10: this.ParameterNameAndUnit = "Absolute Vorticity(s-1)"; break;
              case 11: this.ParameterNameAndUnit = "Absolute Divergence(s-1)"; break;
              case 12: this.ParameterNameAndUnit = "Relative Vorticity(s-1)"; break;
              case 13: this.ParameterNameAndUnit = "Relative Divergence(s-1)"; break;
              case 14: this.ParameterNameAndUnit = "Potential Vorticity(K m2 kg-1 s-1)"; break;
              case 15: this.ParameterNameAndUnit = "Vertical U-Component Shear(s-1)"; break;
              case 16: this.ParameterNameAndUnit = "Vertical V-Component Shear(s-1)"; break;
              case 17: this.ParameterNameAndUnit = "Momentum Flux, U-Component(N m-2)"; break;
              case 18: this.ParameterNameAndUnit = "Momentum Flux, V-Component(N m-2)"; break;
              case 19: this.ParameterNameAndUnit = "Wind Mixing Energy(J)"; break;
              case 20: this.ParameterNameAndUnit = "Boundary Layer Dissipation(W m-2)"; break;
              case 21: this.ParameterNameAndUnit = "Maximum Wind Speed *(m s-1)"; break;
              case 22: this.ParameterNameAndUnit = "Wind Speed (Gust)(m s-1)"; break;
              case 23: this.ParameterNameAndUnit = "U-Component of Wind (Gust)(m s-1)"; break;
              case 24: this.ParameterNameAndUnit = "V-Component of Wind (Gust)(m s-1)"; break;
              case 25: this.ParameterNameAndUnit = "Vertical Speed Shear(s-1)"; break;
              case 26: this.ParameterNameAndUnit = "Horizontal Momentum Flux(N m-2)"; break;
              case 27: this.ParameterNameAndUnit = "U-Component Storm Motion(m s-1)"; break;
              case 28: this.ParameterNameAndUnit = "V-Component Storm Motion(m s-1)"; break;
              case 29: this.ParameterNameAndUnit = "Drag Coefficient(Numeric)"; break;
              case 30: this.ParameterNameAndUnit = "Frictional Velocity(m s-1)"; break;
              case 31: this.ParameterNameAndUnit = "Turbulent Diffusion Coefficient for Momentum(m2 s-1)"; break;
              case 32: this.ParameterNameAndUnit = "Eta Coordinate Vertical Velocity(s-1)"; break;
              case 33: this.ParameterNameAndUnit = "Wind Fetch(m)"; break;
              case 34: this.ParameterNameAndUnit = "Normal Wind Component **(m s-1)"; break;
              case 35: this.ParameterNameAndUnit = "Tangential Wind Component **(m s-1)"; break;
              case 192: this.ParameterNameAndUnit = "Vertical Speed Shear(s-1)"; break;
              case 193: this.ParameterNameAndUnit = "Horizontal Momentum Flux(N m-2)"; break;
              case 194: this.ParameterNameAndUnit = "U-Component Storm Motion(m s-1)"; break;
              case 195: this.ParameterNameAndUnit = "V-Component Storm Motion(m s-1)"; break;
              case 196: this.ParameterNameAndUnit = "Drag Coefficient(non-dim)"; break;
              case 197: this.ParameterNameAndUnit = "Frictional Velocity(m s-1)"; break;
              case 198: this.ParameterNameAndUnit = "Latitude of U Wind Component of Velocity(deg)"; break;
              case 199: this.ParameterNameAndUnit = "Longitude of U Wind Component of Velocity(deg)"; break;
              case 200: this.ParameterNameAndUnit = "Latitude of V Wind Component of Velocity(deg)"; break;
              case 201: this.ParameterNameAndUnit = "Longitude of V Wind Component of Velocity(deg)"; break;
              case 202: this.ParameterNameAndUnit = "Latitude of Presure Point(deg)"; break;
              case 203: this.ParameterNameAndUnit = "Longitude of Presure Point(deg)"; break;
              case 204: this.ParameterNameAndUnit = "Vertical Eddy Diffusivity Heat exchange(m2 s-1)"; break;
              case 205: this.ParameterNameAndUnit = "Covariance between Meridional and Zonal Components of the wind.(m2 s-2)"; break;
              case 206: this.ParameterNameAndUnit = "Covariance between Temperature and Zonal Components of the wind.(K*m s-1)"; break;
              case 207: this.ParameterNameAndUnit = "Covariance between Temperature and Meridional Components of the wind.(K*m s-1)"; break;
              case 208: this.ParameterNameAndUnit = "Vertical Diffusion Zonal Acceleration(m s-2)"; break;
              case 209: this.ParameterNameAndUnit = "Vertical Diffusion Meridional Acceleration(m s-2)"; break;
              case 210: this.ParameterNameAndUnit = "Gravity wave drag zonal acceleration(m s-2)"; break;
              case 211: this.ParameterNameAndUnit = "Gravity wave drag meridional acceleration(m s-2)"; break;
              case 212: this.ParameterNameAndUnit = "Convective zonal momentum mixing acceleration(m s-2)"; break;
              case 213: this.ParameterNameAndUnit = "Convective meridional momentum mixing acceleration(m s-2)"; break;
              case 214: this.ParameterNameAndUnit = "Tendency of vertical velocity(m s-2)"; break;
              case 215: this.ParameterNameAndUnit = "Omega (Dp/Dt) divide by density(K)"; break;
              case 216: this.ParameterNameAndUnit = "Convective Gravity wave drag zonal acceleration(m s-2)"; break;
              case 217: this.ParameterNameAndUnit = "Convective Gravity wave drag meridional acceleration(m s-2)"; break;
              case 218: this.ParameterNameAndUnit = "Velocity Point Model Surface()"; break;
              case 219: this.ParameterNameAndUnit = "Potential Vorticity (Mass-Weighted)(1/s/m)"; break;
              case 220: this.ParameterNameAndUnit = "Hourly Maximum of Upward Vertical Velocity in the lowest 400hPa(m s-1)"; break;
              case 221: this.ParameterNameAndUnit = "Hourly Maximum of Downward Vertical Velocity in the lowest 400hPa(m s-1)"; break;
              case 222: this.ParameterNameAndUnit = "U Component of Hourly Maximum 10m Wind Speed(m s-1)"; break;
              case 223: this.ParameterNameAndUnit = "V Component of Hourly Maximum 10m Wind Speed(m s-1)"; break;
              case 224: this.ParameterNameAndUnit = "Ventilation Rate(m2 s-1)"; break;

              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 3) { // Mass
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Pressure(Pa)"; break;
              case 1: this.ParameterNameAndUnit = "Pressure Reduced to MSL(Pa)"; break;
              case 2: this.ParameterNameAndUnit = "Pressure Tendency(Pa s-1)"; break;
              case 3: this.ParameterNameAndUnit = "ICAO Standard Atmosphere Reference Height(m)"; break;
              case 4: this.ParameterNameAndUnit = "Geopotential(m2 s-2)"; break;
              case 5: this.ParameterNameAndUnit = "Geopotential Height(gpm)"; break;
              case 6: this.ParameterNameAndUnit = "Geometric Height(m)"; break;
              case 7: this.ParameterNameAndUnit = "Standard Deviation of Height(m)"; break;
              case 8: this.ParameterNameAndUnit = "Pressure Anomaly(Pa)"; break;
              case 9: this.ParameterNameAndUnit = "Geopotential Height Anomaly(gpm)"; break;
              case 10: this.ParameterNameAndUnit = "Density(kg m-3)"; break;
              case 11: this.ParameterNameAndUnit = "Altimeter Setting(Pa)"; break;
              case 12: this.ParameterNameAndUnit = "Thickness(m)"; break;
              case 13: this.ParameterNameAndUnit = "Pressure Altitude(m)"; break;
              case 14: this.ParameterNameAndUnit = "Density Altitude(m)"; break;
              case 15: this.ParameterNameAndUnit = "5-Wave Geopotential Height(gpm)"; break;
              case 16: this.ParameterNameAndUnit = "Zonal Flux of Gravity Wave Stress(N m-2)"; break;
              case 17: this.ParameterNameAndUnit = "Meridional Flux of Gravity Wave Stress(N m-2)"; break;
              case 18: this.ParameterNameAndUnit = "Planetary Boundary Layer Height(m)"; break;
              case 19: this.ParameterNameAndUnit = "5-Wave Geopotential Height Anomaly(gpm)"; break;
              case 20: this.ParameterNameAndUnit = "Standard Deviation of Sub-Grid Scale Orography(m)"; break;
              case 21: this.ParameterNameAndUnit = "Angle of Sub-Grid Scale Orography(rad)"; break;
              case 22: this.ParameterNameAndUnit = "Slope of Sub-Grid Scale Orography(Numeric)"; break;
              case 23: this.ParameterNameAndUnit = "Gravity Wave Dissipation(W m-2)"; break;
              case 24: this.ParameterNameAndUnit = "Anisotropy of Sub-Grid Scale Orography(Numeric)"; break;
              case 25: this.ParameterNameAndUnit = "Natural Logarithm of Pressure in Pa(Numeric)"; break;
              case 26: this.ParameterNameAndUnit = "Exner Pressure(Numeric)"; break;
              case 192: this.ParameterNameAndUnit = "MSLP (Eta model reduction)(Pa)"; break;
              case 193: this.ParameterNameAndUnit = "5-Wave Geopotential Height(gpm)"; break;
              case 194: this.ParameterNameAndUnit = "Zonal Flux of Gravity Wave Stress(N m-2)"; break;
              case 195: this.ParameterNameAndUnit = "Meridional Flux of Gravity Wave Stress(N m-2)"; break;
              case 196: this.ParameterNameAndUnit = "Planetary Boundary Layer Height(m)"; break;
              case 197: this.ParameterNameAndUnit = "5-Wave Geopotential Height Anomaly(gpm)"; break;
              case 198: this.ParameterNameAndUnit = "MSLP (MAPS System Reduction)(Pa)"; break;
              case 199: this.ParameterNameAndUnit = "3-hr pressure tendency (Std. Atmos. Reduction)(Pa s-1)"; break;
              case 200: this.ParameterNameAndUnit = "Pressure of level from which parcel was lifted(Pa)"; break;
              case 201: this.ParameterNameAndUnit = "X-gradient of Log Pressure(m-1)"; break;
              case 202: this.ParameterNameAndUnit = "Y-gradient of Log Pressure(m-1)"; break;
              case 203: this.ParameterNameAndUnit = "X-gradient of Height(m-1)"; break;
              case 204: this.ParameterNameAndUnit = "Y-gradient of Height(m-1)"; break;
              case 205: this.ParameterNameAndUnit = "Layer Thickness(m)"; break;
              case 206: this.ParameterNameAndUnit = "Natural Log of Surface Pressure(ln (kPa))"; break;
              case 207: this.ParameterNameAndUnit = "Convective updraft mass flux(kg m-2 s-1)"; break;
              case 208: this.ParameterNameAndUnit = "Convective downdraft mass flux(kg m-2 s-1)"; break;
              case 209: this.ParameterNameAndUnit = "Convective detrainment mass flux(kg m-2 s-1)"; break;
              case 210: this.ParameterNameAndUnit = "Mass Point Model Surface()"; break;
              case 211: this.ParameterNameAndUnit = "Geopotential Height (nearest grid point)(gpm)"; break;
              case 212: this.ParameterNameAndUnit = "Pressure (nearest grid point)(Pa)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 4) { // Short wave radiation
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Net Short-Wave Radiation Flux (Surface)*(W m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Net Short-Wave Radiation Flux (Top of Atmosphere)*(W m-2)"; break;
              case 2: this.ParameterNameAndUnit = "Short-Wave Radiation Flux*(W m-2)"; break;
              case 3: this.ParameterNameAndUnit = "Global Radiation Flux(W m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Brightness Temperature(K)"; break;
              case 5: this.ParameterNameAndUnit = "Radiance (with respect to wave number)(W m-1 sr-1)"; break;
              case 6: this.ParameterNameAndUnit = "Radiance (with respect to wavelength)(W m-3 sr-1)"; break;
              case 7: this.ParameterNameAndUnit = "Downward Short-Wave Radiation Flux(W m-2)"; break;
              case 8: this.ParameterNameAndUnit = "Upward Short-Wave Radiation Flux(W m-2)"; break;
              case 9: this.ParameterNameAndUnit = "Net Short Wave Radiation Flux(W m-2)"; break;
              case 10: this.ParameterNameAndUnit = "Photosynthetically Active Radiation(W m-2)"; break;
              case 11: this.ParameterNameAndUnit = "Net Short-Wave Radiation Flux, Clear Sky(W m-2)"; break;
              case 12: this.ParameterNameAndUnit = "Downward UV Radiation(W m-2)"; break;
              case 50: this.ParameterNameAndUnit = "UV Index (Under Clear Sky)**(Numeric)"; break;
              case 51: this.ParameterNameAndUnit = "UV Index**(W m-2)"; break;
              case 192: this.ParameterNameAndUnit = "Downward Short-Wave Radiation Flux(W m-2)"; break;
              case 193: this.ParameterNameAndUnit = "Upward Short-Wave Radiation Flux(W m-2)"; break;
              case 194: this.ParameterNameAndUnit = "UV-B Downward Solar Flux(W m-2)"; break;
              case 195: this.ParameterNameAndUnit = "Clear sky UV-B Downward Solar Flux(W m-2)"; break;
              case 196: this.ParameterNameAndUnit = "Clear Sky Downward Solar Flux(W m-2)"; break;
              case 197: this.ParameterNameAndUnit = "Solar Radiative Heating Rate(K s-1)"; break;
              case 198: this.ParameterNameAndUnit = "Clear Sky Upward Solar Flux(W m-2)"; break;
              case 199: this.ParameterNameAndUnit = "Cloud Forcing Net Solar Flux(W m-2)"; break;
              case 200: this.ParameterNameAndUnit = "Visible Beam Downward Solar Flux(W m-2)"; break;
              case 201: this.ParameterNameAndUnit = "Visible Diffuse Downward Solar Flux(W m-2)"; break;
              case 202: this.ParameterNameAndUnit = "Near IR Beam Downward Solar Flux(W m-2)"; break;
              case 203: this.ParameterNameAndUnit = "Near IR Diffuse Downward Solar Flux(W m-2)"; break;
              case 204: this.ParameterNameAndUnit = "Downward Total Radiation Flux(W m-2)"; break;
              case 205: this.ParameterNameAndUnit = "Upward Total Radiation Flux(W m-2)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 5) { // Long wave radiation
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Net Long-Wave Radiation Flux (Surface)*(W m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Net Long-Wave Radiation Flux (Top of Atmosphere)*(W m-2)"; break;
              case 2: this.ParameterNameAndUnit = "Long-Wave Radiation Flux*(W m-2)"; break;
              case 3: this.ParameterNameAndUnit = "Downward Long-Wave Rad. Flux(W m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Upward Long-Wave Rad. Flux(W m-2)"; break;
              case 5: this.ParameterNameAndUnit = "Net Long-Wave Radiation Flux(W m-2)"; break;
              case 6: this.ParameterNameAndUnit = "Net Long-Wave Radiation Flux, Clear Sky(W m-2)"; break;
              case 192: this.ParameterNameAndUnit = "Downward Long-Wave Rad. Flux(W m-2)"; break;
              case 193: this.ParameterNameAndUnit = "Upward Long-Wave Rad. Flux(W m-2)"; break;
              case 194: this.ParameterNameAndUnit = "Long-Wave Radiative Heating Rate(K s-1)"; break;
              case 195: this.ParameterNameAndUnit = "Clear Sky Upward Long Wave Flux(W m-2)"; break;
              case 196: this.ParameterNameAndUnit = "Clear Sky Downward Long Wave Flux(W m-2)"; break;
              case 197: this.ParameterNameAndUnit = "Cloud Forcing Net Long Wave Flux(W m-2)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 6) { // Cloud
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Cloud Ice(kg m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Total Cloud Cover(%)"; break;
              case 2: this.ParameterNameAndUnit = "Convective Cloud Cover(%)"; break;
              case 3: this.ParameterNameAndUnit = "Low Cloud Cover(%)"; break;
              case 4: this.ParameterNameAndUnit = "Medium Cloud Cover(%)"; break;
              case 5: this.ParameterNameAndUnit = "High Cloud Cover(%)"; break;
              case 6: this.ParameterNameAndUnit = "Cloud Water(kg m-2)"; break;
              case 7: this.ParameterNameAndUnit = "Cloud Amount(%)"; break;
              case 8: this.ParameterNameAndUnit = "Cloud Type(See Table 4.203)"; break;
              case 9: this.ParameterNameAndUnit = "Thunderstorm Maximum Tops(m)"; break;
              case 10: this.ParameterNameAndUnit = "Thunderstorm Coverage(See Table 4.204)"; break;
              case 11: this.ParameterNameAndUnit = "Cloud Base(m)"; break;
              case 12: this.ParameterNameAndUnit = "Cloud Top(m)"; break;
              case 13: this.ParameterNameAndUnit = "Ceiling(m)"; break;
              case 14: this.ParameterNameAndUnit = "Non-Convective Cloud Cover(%)"; break;
              case 15: this.ParameterNameAndUnit = "Cloud Work Function(J kg-1)"; break;
              case 16: this.ParameterNameAndUnit = "Convective Cloud Efficiency(Proportion)"; break;
              case 17: this.ParameterNameAndUnit = "Total Condensate *(kg kg-1)"; break;
              case 18: this.ParameterNameAndUnit = "Total Column-Integrated Cloud Water *(kg m-2)"; break;
              case 19: this.ParameterNameAndUnit = "Total Column-Integrated Cloud Ice *(kg m-2)"; break;
              case 20: this.ParameterNameAndUnit = "Total Column-Integrated Condensate *(kg m-2)"; break;
              case 21: this.ParameterNameAndUnit = "Ice fraction of total condensate(Proportion)"; break;
              case 22: this.ParameterNameAndUnit = "Cloud Cover(%)"; break;
              case 23: this.ParameterNameAndUnit = "Cloud Ice Mixing Ratio *(kg kg-1)"; break;
              case 24: this.ParameterNameAndUnit = "Sunshine(Numeric)"; break;
              case 25: this.ParameterNameAndUnit = "Horizontal Extent of Cumulonimbus (CB)(%)"; break;
              case 26: this.ParameterNameAndUnit = "Height of Convective Cloud Base(m)"; break;
              case 27: this.ParameterNameAndUnit = "Height of Convective Cloud Top(m)"; break;
              case 28: this.ParameterNameAndUnit = "Number Concentration of Cloud Droplets(kg-1)"; break;
              case 29: this.ParameterNameAndUnit = "Number Concentration of Cloud Ice(kg-1)"; break;
              case 30: this.ParameterNameAndUnit = "Number Density of Cloud Droplets(m-3)"; break;
              case 31: this.ParameterNameAndUnit = "Number Density of Cloud Ice(m-3)"; break;
              case 32: this.ParameterNameAndUnit = "Fraction of Cloud Cover(Numeric)"; break;
              case 33: this.ParameterNameAndUnit = "Sunshine Duration(s)"; break;
              case 34: this.ParameterNameAndUnit = "Surface Long Wave Effective Total Cloudiness(Numeric)"; break;
              case 35: this.ParameterNameAndUnit = "Surface Short Wave Effective Total Cloudiness(Numeric)"; break;
              case 192: this.ParameterNameAndUnit = "Non-Convective Cloud Cover(%)"; break;
              case 193: this.ParameterNameAndUnit = "Cloud Work Function(J kg-1)"; break;
              case 194: this.ParameterNameAndUnit = "Convective Cloud Efficiency(non-dim)"; break;
              case 195: this.ParameterNameAndUnit = "Total Condensate(kg kg-1)"; break;
              case 196: this.ParameterNameAndUnit = "Total Column-Integrated Cloud Water(kg m-2)"; break;
              case 197: this.ParameterNameAndUnit = "Total Column-Integrated Cloud Ice(kg m-2)"; break;
              case 198: this.ParameterNameAndUnit = "Total Column-Integrated Condensate(kg m-2)"; break;
              case 199: this.ParameterNameAndUnit = "Ice fraction of total condensate(non-dim)"; break;
              case 200: this.ParameterNameAndUnit = "Convective Cloud Mass Flux(Pa s-1)"; break;
              case 201: this.ParameterNameAndUnit = "Sunshine Duration(s)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 7) { // Thermodynamic stability indices
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Parcel Lifted Index (to 500 hPa)(K)"; break;
              case 1: this.ParameterNameAndUnit = "Best Lifted Index (to 500 hPa)(K)"; break;
              case 2: this.ParameterNameAndUnit = "K Index(K)"; break;
              case 3: this.ParameterNameAndUnit = "KO Index(K)"; break;
              case 4: this.ParameterNameAndUnit = "Total Totals Index(K)"; break;
              case 5: this.ParameterNameAndUnit = "Sweat Index(Numeric)"; break;
              case 6: this.ParameterNameAndUnit = "Convective Available Potential Energy(J kg-1)"; break;
              case 7: this.ParameterNameAndUnit = "Convective Inhibition(J kg-1)"; break;
              case 8: this.ParameterNameAndUnit = "Storm Relative Helicity(m2 s-2)"; break;
              case 9: this.ParameterNameAndUnit = "Energy Helicity Index(Numeric)"; break;
              case 10: this.ParameterNameAndUnit = "Surface Lifted Index(K)"; break;
              case 11: this.ParameterNameAndUnit = "Best (4 layer) Lifted Index(K)"; break;
              case 12: this.ParameterNameAndUnit = "Richardson Number(Numeric)"; break;
              case 13: this.ParameterNameAndUnit = "Showalter Index(K)"; break;
              case 15: this.ParameterNameAndUnit = "Updraft Helicity(m2 s-2)"; break;
              case 192: this.ParameterNameAndUnit = "Surface Lifted Index(K)"; break;
              case 193: this.ParameterNameAndUnit = "Best (4 layer) Lifted Index(K)"; break;
              case 194: this.ParameterNameAndUnit = "Richardson Number(Numeric)"; break;
              case 195: this.ParameterNameAndUnit = "Convective Weather Detection Index()"; break;
              case 196: this.ParameterNameAndUnit = "Ultra Violet Index(W m-2)"; break;
              case 197: this.ParameterNameAndUnit = "Updraft Helicity(m2 s-2)"; break;
              case 198: this.ParameterNameAndUnit = "Leaf Area Index()"; break;
              case 199: this.ParameterNameAndUnit = "Hourly Maximum of Updraft Helicity over Layer 2km to 5 km AGL(m2 s-2)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 13) { // Aerosols
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Aerosol Type(See Table 4.205)"; break;
              case 192: this.ParameterNameAndUnit = "Particulate matter (coarse)(g m-3)"; break;
              case 193: this.ParameterNameAndUnit = "Particulate matter (fine)(g m-3)"; break;
              case 194: this.ParameterNameAndUnit = "Particulate matter (fine)(log10 (g m-3))"; break;
              case 195: this.ParameterNameAndUnit = "Integrated column particulate matter (fine)(log10 (g m-3))"; break;

              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 14) { // Trace gases
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Total Ozone(DU)"; break;
              case 1: this.ParameterNameAndUnit = "Ozone Mixing Ratio(kg kg-1)"; break;
              case 2: this.ParameterNameAndUnit = "Total Column Integrated Ozone(DU)"; break;
              case 192: this.ParameterNameAndUnit = "Ozone Mixing Ratio(kg kg-1)"; break;
              case 193: this.ParameterNameAndUnit = "Ozone Concentration(ppb)"; break;
              case 194: this.ParameterNameAndUnit = "Categorical Ozone Concentration(Non-Dim)"; break;
              case 195: this.ParameterNameAndUnit = "Ozone Vertical Diffusion(kg kg-1 s-1)"; break;
              case 196: this.ParameterNameAndUnit = "Ozone Production(kg kg-1 s-1)"; break;
              case 197: this.ParameterNameAndUnit = "Ozone Tendency(kg kg-1 s-1)"; break;
              case 198: this.ParameterNameAndUnit = "Ozone Production from Temperature Term(kg kg-1 s-1)"; break;
              case 199: this.ParameterNameAndUnit = "Ozone Production from Column Ozone Term(kg kg-1 s-1)"; break;
              case 200: this.ParameterNameAndUnit = "Ozone Daily Max from 1-hour Average(ppbV)"; break;
              case 201: this.ParameterNameAndUnit = "Ozone Daily Max from 8-hour Average(ppbV)"; break;
              case 202: this.ParameterNameAndUnit = "PM 2.5 Daily Max from 1-hour Average(g m-3)"; break;
              case 203: this.ParameterNameAndUnit = "PM 2.5 Daily Max from 24-hour Average(g m-3)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 15) { // Radar
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Base Spectrum Width(m s-1)"; break;
              case 1: this.ParameterNameAndUnit = "Base Reflectivity(dB)"; break;
              case 2: this.ParameterNameAndUnit = "Base Radial Velocity(m s-1)"; break;
              case 3: this.ParameterNameAndUnit = "Vertically-Integrated Liquid Water(kg m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Layer Maximum Base Reflectivity(dB)"; break;
              case 5: this.ParameterNameAndUnit = "Precipitation(kg m-2)"; break;
              case 6: this.ParameterNameAndUnit = "Radar Spectra (1)()"; break;
              case 7: this.ParameterNameAndUnit = "Radar Spectra (2)()"; break;
              case 8: this.ParameterNameAndUnit = "Radar Spectra (3)()"; break;
              case 9: this.ParameterNameAndUnit = "Reflectivity of Cloud Droplets(dB)"; break;
              case 10: this.ParameterNameAndUnit = "Reflectivity of Cloud Ice(dB)"; break;
              case 11: this.ParameterNameAndUnit = "Reflectivity of Snow(dB)"; break;
              case 12: this.ParameterNameAndUnit = "Reflectivity of Rain(dB)"; break;
              case 13: this.ParameterNameAndUnit = "Reflectivity of Graupel(dB)"; break;
              case 14: this.ParameterNameAndUnit = "Reflectivity of Hail(dB)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 16) { // Forecast Radar Imagery
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Equivalent radar reflectivity factor for rain(m m6 m-3)"; break;
              case 1: this.ParameterNameAndUnit = "Equivalent radar reflectivity factor for snow(m m6 m-3)"; break;
              case 2: this.ParameterNameAndUnit = "Equivalent radar reflectivity factor for parameterized convection(m m6 m-3)"; break;
              case 3: this.ParameterNameAndUnit = "Echo Top (See Note 1)(m)"; break;
              case 4: this.ParameterNameAndUnit = "Reflectivity(dB)"; break;
              case 5: this.ParameterNameAndUnit = "Composite reflectivity(dB)"; break;
              case 192: this.ParameterNameAndUnit = "Equivalent radar reflectivity factor for rain(m m6 m-3)"; break;
              case 193: this.ParameterNameAndUnit = "Equivalent radar reflectivity factor for snow(m m6 m-3)"; break;
              case 194: this.ParameterNameAndUnit = "Equivalent radar reflectivity factor for parameterized convection(m m6 m-3)"; break;
              case 195: this.ParameterNameAndUnit = "Reflectivity(dB)"; break;
              case 196: this.ParameterNameAndUnit = "Composite reflectivity(dB)"; break;
              case 197: this.ParameterNameAndUnit = "Echo Top (See Note 1)(m)"; break;
              case 198: this.ParameterNameAndUnit = "Hourly Maximum of Simulated Reflectivity at 1 km AGL(dB)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }

          else if (this.CategoryOfParametersByProductDiscipline === 17) { // Electrodynamics
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 192: this.ParameterNameAndUnit = "Lightning(non-dim)"; break;

              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 18) { // Nuclear/radiology
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Air Concentration of Caesium 137(Bq m-3)"; break;
              case 1: this.ParameterNameAndUnit = "Air Concentration of Iodine 131(Bq m-3)"; break;
              case 2: this.ParameterNameAndUnit = "Air Concentration of Radioactive Pollutant(Bq m-3)"; break;
              case 3: this.ParameterNameAndUnit = "Ground Deposition of Caesium 137(Bq m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Ground Deposition of Iodine 131(Bq m-2)"; break;
              case 5: this.ParameterNameAndUnit = "Ground Deposition of Radioactive Pollutant(Bq m-2)"; break;
              case 6: this.ParameterNameAndUnit = "Time Integrated Air Concentration of Cesium Pollutant See Note 1(Bq s m-3)"; break;
              case 7: this.ParameterNameAndUnit = "Time Integrated Air Concentration of Iodine Pollutant See Note 1(Bq s m-3)"; break;
              case 8: this.ParameterNameAndUnit = "Time Integrated Air Concentration of Radioactive Pollutant See Note 1(Bq s m-3)"; break;
              case 10: this.ParameterNameAndUnit = "Air Concentration(Bq m-3)"; break;
              case 11: this.ParameterNameAndUnit = "Wet Deposition(Bq m-2)"; break;
              case 12: this.ParameterNameAndUnit = "Dry Deposition(Bq m-2)"; break;
              case 13: this.ParameterNameAndUnit = "Total Deposition (Wet + Dry)(Bq m-2)"; break;

              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 19) { // Physical atmospheric Properties
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Visibility(m)"; break;
              case 1: this.ParameterNameAndUnit = "Albedo(%)"; break;
              case 2: this.ParameterNameAndUnit = "Thunderstorm Probability(%)"; break;
              case 3: this.ParameterNameAndUnit = "Mixed Layer Depth(m)"; break;
              case 4: this.ParameterNameAndUnit = "Volcanic Ash(See Table 4.206)"; break;
              case 5: this.ParameterNameAndUnit = "Icing Top(m)"; break;
              case 6: this.ParameterNameAndUnit = "Icing Base(m)"; break;
              case 7: this.ParameterNameAndUnit = "Icing(See Table 4.207)"; break;
              case 8: this.ParameterNameAndUnit = "Turbulence Top(m)"; break;
              case 9: this.ParameterNameAndUnit = "Turbulence Base(m)"; break;
              case 10: this.ParameterNameAndUnit = "Turbulence(See Table 4.208)"; break;
              case 11: this.ParameterNameAndUnit = "Turbulent Kinetic Energy(J kg-1)"; break;
              case 12: this.ParameterNameAndUnit = "Planetary Boundary Layer Regime(See Table 4.209)"; break;
              case 13: this.ParameterNameAndUnit = "Contrail Intensity(See Table 4.210)"; break;
              case 14: this.ParameterNameAndUnit = "Contrail Engine Type(See Table 4.211)"; break;
              case 15: this.ParameterNameAndUnit = "Contrail Top(m)"; break;
              case 16: this.ParameterNameAndUnit = "Contrail Base(m)"; break;
              case 17: this.ParameterNameAndUnit = "Maximum Snow Albedosee Note 1(%)"; break;
              case 18: this.ParameterNameAndUnit = "Snow-Free Albedo(%)"; break;
              case 19: this.ParameterNameAndUnit = "Snow Albedo(%)"; break;
              case 20: this.ParameterNameAndUnit = "Icing(%)"; break;
              case 21: this.ParameterNameAndUnit = "In-Cloud Turbulence(%)"; break;
              case 22: this.ParameterNameAndUnit = "Clear Air Turbulence (CAT)(%)"; break;
              case 23: this.ParameterNameAndUnit = "Supercooled Large Droplet Probabilitysee Note 2(%)"; break;
              case 24: this.ParameterNameAndUnit = "Convective Turbulent Kinetic Energy(J kg-1)"; break;
              case 25: this.ParameterNameAndUnit = "Weather(See Table 4.225)"; break;
              case 26: this.ParameterNameAndUnit = "Convective Outlook(See Table 4.224)"; break;
              case 27: this.ParameterNameAndUnit = "Icing Scenario(See Table 4.227)"; break;
              case 192: this.ParameterNameAndUnit = "Maximum Snow Albedo(%)"; break;
              case 193: this.ParameterNameAndUnit = "Snow-Free Albedo(%)"; break;
              case 194: this.ParameterNameAndUnit = "Slight risk convective outlook(categorical)"; break;
              case 195: this.ParameterNameAndUnit = "Moderate risk convective outlook(categorical)"; break;
              case 196: this.ParameterNameAndUnit = "High risk convective outlook(categorical)"; break;
              case 197: this.ParameterNameAndUnit = "Tornado probability(%)"; break;
              case 198: this.ParameterNameAndUnit = "Hail probability(%)"; break;
              case 199: this.ParameterNameAndUnit = "Wind probability(%)"; break;
              case 200: this.ParameterNameAndUnit = "Significant Tornado probability(%)"; break;
              case 201: this.ParameterNameAndUnit = "Significant Hail probability(%)"; break;
              case 202: this.ParameterNameAndUnit = "Significant Wind probability(%)"; break;
              case 203: this.ParameterNameAndUnit = "Categorical Thunderstorm(Code table 4.222)"; break;
              case 204: this.ParameterNameAndUnit = "Number of mixed layers next to surface(integer)"; break;
              case 205: this.ParameterNameAndUnit = "Flight Category()"; break;
              case 206: this.ParameterNameAndUnit = "Confidence - Ceiling()"; break;
              case 207: this.ParameterNameAndUnit = "Confidence - Visibility()"; break;
              case 208: this.ParameterNameAndUnit = "Confidence - Flight Category()"; break;
              case 209: this.ParameterNameAndUnit = "Low-Level aviation interest()"; break;
              case 210: this.ParameterNameAndUnit = "High-Level aviation interest()"; break;
              case 211: this.ParameterNameAndUnit = "Visible, Black Sky Albedo(%)"; break;
              case 212: this.ParameterNameAndUnit = "Visible, White Sky Albedo(%)"; break;
              case 213: this.ParameterNameAndUnit = "Near IR, Black Sky Albedo(%)"; break;
              case 214: this.ParameterNameAndUnit = "Near IR, White Sky Albedo(%)"; break;
              case 215: this.ParameterNameAndUnit = "Total Probability of Severe Thunderstorms (Days 2,3)(%)"; break;
              case 216: this.ParameterNameAndUnit = "Total Probability of Extreme Severe Thunderstorms (Days 2,3)(%)"; break;
              case 217: this.ParameterNameAndUnit = "Supercooled Large Droplet (SLD) Icingsee Note 2(See Table 4.207)"; break;
              case 218: this.ParameterNameAndUnit = "Radiative emissivity()"; break;
              case 219: this.ParameterNameAndUnit = "Turbulence Potential Forecast Index()"; break;
              case 220: this.ParameterNameAndUnit = "Categorical Severe Thunderstorm(Code table 4.222)"; break;
              case 221: this.ParameterNameAndUnit = "Probability of Convection(%)"; break;
              case 222: this.ParameterNameAndUnit = "Convection Potential(Code table 4.222)"; break;
              case 232: this.ParameterNameAndUnit = "Volcanic Ash Forecast Transport and Dispersion(log10 (kg m-3))"; break;
              case 233: this.ParameterNameAndUnit = "Icing probability(non-dim)"; break;
              case 234: this.ParameterNameAndUnit = "Icing severity(non-dim)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 20) { // Atmospheric Chemical Constituents
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Mass Density (Concentration)(kg m-3)"; break;
              case 1: this.ParameterNameAndUnit = "Column-Integrated Mass Density (See Note 1)(kg m-2)"; break;
              case 2: this.ParameterNameAndUnit = "Mass Mixing Ratio (Mass Fraction in Air)(kg kg-1)"; break;
              case 3: this.ParameterNameAndUnit = ">Atmosphere Emission Mass Flux(kg m-2s-1)"; break;
              case 4: this.ParameterNameAndUnit = "Atmosphere Net Production Mass Flux(kg m-2s-1)"; break;
              case 5: this.ParameterNameAndUnit = ">Atmosphere Net Production And Emision Mass Flux(kg m-2s-1)"; break;
              case 6: this.ParameterNameAndUnit = "Surface Dry Deposition Mass Flux(kg m-2s-1)"; break;
              case 7: this.ParameterNameAndUnit = "Surface Wet Deposition Mass Flux(kg m-2s-1)"; break;
              case 8: this.ParameterNameAndUnit = "Atmosphere Re-Emission Mass Flux(kg m-2s-1)"; break;
              case 9: this.ParameterNameAndUnit = "Wet Deposition by Large-Scale Precipitation Mass Flux(kg m-2s-1)"; break;
              case 10: this.ParameterNameAndUnit = "Wet Deposition by Convective Precipitation Mass Flux(kg m-2s-1)"; break;
              case 11: this.ParameterNameAndUnit = "Sedimentation Mass Flux(kg m-2s-1)"; break;
              case 12: this.ParameterNameAndUnit = "Dry Deposition Mass Flux(kg m-2s-1)"; break;
              case 13: this.ParameterNameAndUnit = "Transfer From Hydrophobic to Hydrophilic(kg kg-1s-1)"; break;
              case 14: this.ParameterNameAndUnit = "Transfer From SO2 (Sulphur Dioxide) to SO4 (Sulphate)(kg kg-1s-1)"; break;
              case 50: this.ParameterNameAndUnit = "Amount in Atmosphere(mol)"; break;
              case 51: this.ParameterNameAndUnit = "Concentration In Air(mol m-3)"; break;
              case 52: this.ParameterNameAndUnit = "Volume Mixing Ratio (Fraction in Air)(mol mol-1)"; break;
              case 53: this.ParameterNameAndUnit = "Chemical Gross Production Rate of Concentration(mol m-3s-1)"; break;
              case 54: this.ParameterNameAndUnit = "Chemical Gross Destruction Rate of Concentration(mol m-3s-1)"; break;
              case 55: this.ParameterNameAndUnit = "Surface Flux(mol m-2s-1)"; break;
              case 56: this.ParameterNameAndUnit = "Changes Of Amount in Atmosphere (See Note 1)(mol s-1)"; break;
              case 57: this.ParameterNameAndUnit = "Total Yearly Average Burden of The Atmosphere>(mol)"; break;
              case 58: this.ParameterNameAndUnit = "Total Yearly Average Atmospheric Loss (See Note 1)(mol s-1)"; break;
              case 59: this.ParameterNameAndUnit = "Aerosol Number Concentration(m-3)"; break;
              case 100: this.ParameterNameAndUnit = "Surface Area Density (Aerosol)(m-1)"; break;
              case 101: this.ParameterNameAndUnit = "Vertical Visual Range(m)"; break;
              case 102: this.ParameterNameAndUnit = "Aerosol Optical Thickness(Numeric)"; break;
              case 103: this.ParameterNameAndUnit = "Single Scattering Albedo(Numeric)"; break;
              case 104: this.ParameterNameAndUnit = "Asymmetry Factor(Numeric)"; break;
              case 105: this.ParameterNameAndUnit = "Aerosol Extinction Coefficient(m-1)"; break;
              case 106: this.ParameterNameAndUnit = "Aerosol Absorption Coefficient(m-1)"; break;
              case 107: this.ParameterNameAndUnit = "Aerosol Lidar Backscatter from Satellite(m-1sr-1)"; break;
              case 108: this.ParameterNameAndUnit = "Aerosol Lidar Backscatter from the Ground(m-1sr-1)"; break;
              case 109: this.ParameterNameAndUnit = "Aerosol Lidar Extinction from Satellite(m-1)"; break;
              case 110: this.ParameterNameAndUnit = "Aerosol Lidar Extinction from the Ground(m-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 190) { // CCITT IA5 string
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Arbitrary Text String(CCITTIA5)"; break;

              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 191) { // Miscellaneous
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Seconds prior to initial reference time (defined in Section 1)(s)"; break;
              case 1: this.ParameterNameAndUnit = "Geographical Latitude(N)"; break;
              case 2: this.ParameterNameAndUnit = "Geographical Longitude(E)"; break;
              case 192: this.ParameterNameAndUnit = "Latitude (-90 to 90)()"; break;
              case 193: this.ParameterNameAndUnit = "East Longitude (0 to 360)()"; break;
              case 194: this.ParameterNameAndUnit = "Seconds prior to initial reference time(s)"; break;
              case 195: this.ParameterNameAndUnit = "Model Layer number (From bottom up)()"; break;
              case 196: this.ParameterNameAndUnit = "Latitude (nearest neighbor) (-90 to 90)()"; break;
              case 197: this.ParameterNameAndUnit = "East Longitude (nearest neighbor) (0 to 360)()"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 192) { // Covariance
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 1: this.ParameterNameAndUnit = "Covariance between zonal and meridional components of the wind. Defined as [uv]-[u][v], where [] indicates the mean over the indicated time span.(m2/s2)"; break;
              case 2: this.ParameterNameAndUnit = "Covariance between zonal component of the wind and temperature. Defined as [uT]-[u][T], where [] indicates the mean over the indicated time span.(K*m/s)"; break;
              case 3: this.ParameterNameAndUnit = "Covariance between meridional component of the wind and temperature. Defined as [vT]-[v][T], where [] indicates the mean over the indicated time span.(K*m/s)"; break;
              case 4: this.ParameterNameAndUnit = "Covariance between temperature and vertical component of the wind. Defined as [wT]-[w][T], where [] indicates the mean over the indicated time span.(K*m/s)"; break;
              case 5: this.ParameterNameAndUnit = "Covariance between zonal and zonal components of the wind. Defined as [uu]-[u][u], where [] indicates the mean over the indicated time span.(m2/s2)"; break;
              case 6: this.ParameterNameAndUnit = "Covariance between meridional and meridional components of the wind. Defined as [vv]-[v][v], where [] indicates the mean over the indicated time span.(m2/s2)"; break;
              case 7: this.ParameterNameAndUnit = "Covariance between specific humidity and zonal components of the wind. Defined as [uq]-[u][q], where [] indicates the mean over the indicated time span.(kg/kg*m/s)"; break;
              case 8: this.ParameterNameAndUnit = "Covariance between specific humidity and meridional components of the wind. Defined as [vq]-[v][q], where [] indicates the mean over the indicated time span.(kg/kg*m/s)"; break;
              case 9: this.ParameterNameAndUnit = "Covariance between temperature and vertical components of the wind. Defined as [T]-[][T], where [] indicates the mean over the indicated time span.(K*Pa/s)"; break;
              case 10: this.ParameterNameAndUnit = "Covariance between specific humidity and vertical components of the wind. Defined as [q]-[][q], where [] indicates the mean over the indicated time span.(kg/kg*Pa/s)"; break;
              case 11: this.ParameterNameAndUnit = "Covariance between surface pressure and surface pressure. Defined as [Psfc]-[Psfc][Psfc], where [] indicates the mean over the indicated time span.(Pa*Pa)"; break;
              case 12: this.ParameterNameAndUnit = "Covariance between specific humidity and specific humidy. Defined as [qq]-[q][q], where [] indicates the mean over the indicated time span.(kg/kg*kg/kg)"; break;
              case 13: this.ParameterNameAndUnit = "Covariance between vertical and vertical components of the wind. Defined as []-[][], where [] indicates the mean over the indicated time span.(Pa2/s2)"; break;
              case 14: this.ParameterNameAndUnit = "Covariance between temperature and temperature. Defined as [TT]-[T][T], where [] indicates the mean over the indicated time span.(K*K)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
        }
        else if (this.DisciplineOfProcessedData === 1) { // Hydrological
          if (this.CategoryOfParametersByProductDiscipline === 0) { // Hydrology Basic
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Flash Flood Guidance (Encoded as an accumulation over a floating subinterval of time between the reference time and valid time)(kg m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Flash Flood Runoff (Encoded as an accumulation over a floating subinterval of time)(kg m-2)"; break;
              case 2: this.ParameterNameAndUnit = "Remotely Sensed Snow Cover(See Table 4.215)"; break;
              case 3: this.ParameterNameAndUnit = "Elevation of Snow Covered Terrain(See Table 4.216)"; break;
              case 4: this.ParameterNameAndUnit = "Snow Water Equivalent Percent of Normal(%)"; break;
              case 5: this.ParameterNameAndUnit = "Baseflow-Groundwater Runoff(kg m-2)"; break;
              case 6: this.ParameterNameAndUnit = "Storm Surface Runoff(kg m-2)"; break;
              case 192: this.ParameterNameAndUnit = "Baseflow-Groundwater Runoff(kg m-2)"; break;
              case 193: this.ParameterNameAndUnit = "Storm Surface Runoff(kg m-2)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 1) { // Hydrology Probabilities
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Conditional percent precipitation amount fractile for an overall period (encoded as an accumulation)(kg m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Percent Precipitation in a sub-period of an overall period (encoded as a percent accumulation over the sub-period)(%)"; break;
              case 2: this.ParameterNameAndUnit = "Probability of 0.01 inch of precipitation (POP)(%)"; break;
              case 192: this.ParameterNameAndUnit = "Probability of Freezing Precipitation(%)"; break;
              case 193: this.ParameterNameAndUnit = "Probability of Frozen Precipitation(%)"; break;
              case 194: this.ParameterNameAndUnit = "Probability of precipitation exceeding flash flood guidance values(%)"; break;
              case 195: this.ParameterNameAndUnit = "Probability of Wetting Rain, exceeding in 0.10 in a given time period(%)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 2) { // Inland Water and Sediment Properties
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Water Depth(m)"; break;
              case 1: this.ParameterNameAndUnit = "Water Temperature(K)"; break;
              case 2: this.ParameterNameAndUnit = "Water Fraction(Proportion)"; break;
              case 3: this.ParameterNameAndUnit = "Sediment Thickness(m)"; break;
              case 4: this.ParameterNameAndUnit = "Sediment Temperature(K)"; break;
              case 5: this.ParameterNameAndUnit = "Ice Thickness(m)"; break;
              case 6: this.ParameterNameAndUnit = "Ice Temperature(K)"; break;
              case 7: this.ParameterNameAndUnit = "Ice Cover(Proportion)"; break;
              case 8: this.ParameterNameAndUnit = "Land Cover (0=water, 1=land)(Proportion)"; break;
              case 9: this.ParameterNameAndUnit = "Shape Factor with Respect to Salinity Profile()"; break;
              case 10: this.ParameterNameAndUnit = "Shape Factor with Respect to Temperature Profile in Thermocline()"; break;
              case 11: this.ParameterNameAndUnit = "Attenuation Coefficient of Water with Respect to Solar Attenuation Coefficient of Water with Respect to Solar Radiation(m-1)"; break;
              case 12: this.ParameterNameAndUnit = "Salinity(kg kg-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
        }
        else if (this.DisciplineOfProcessedData === 2) { // Land surface
          if (this.CategoryOfParametersByProductDiscipline === 0) { // Vegetation/Biomass
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Land Cover (0=sea, 1=land)(Proportion)"; break;
              case 1: this.ParameterNameAndUnit = "Surface Roughness(m)"; break;
              case 2: this.ParameterNameAndUnit = "Soil Temperature ***(K)"; break;
              case 3: this.ParameterNameAndUnit = "Soil Moisture Content*(kg m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Vegetation(%)"; break;
              case 5: this.ParameterNameAndUnit = "Water Runoff(kg m-2)"; break;
              case 6: this.ParameterNameAndUnit = "Evapotranspiration(kg-2 s-1)"; break;
              case 7: this.ParameterNameAndUnit = "Model Terrain Height(m)"; break;
              case 8: this.ParameterNameAndUnit = "Land Use(See Table 4.212)"; break;
              case 9: this.ParameterNameAndUnit = "Volumetric Soil Moisture Content**(Proportion)"; break;
              case 10: this.ParameterNameAndUnit = "Ground Heat Flux*(W m-2)"; break;
              case 11: this.ParameterNameAndUnit = "Moisture Availability(%)"; break;
              case 12: this.ParameterNameAndUnit = "Exchange Coefficient(kg m-2 s-1)"; break;
              case 13: this.ParameterNameAndUnit = "Plant Canopy Surface Water(kg m-2)"; break;
              case 14: this.ParameterNameAndUnit = "Blackadar's Mixing Length Scale(m)"; break;
              case 15: this.ParameterNameAndUnit = "Canopy Conductance(m s-1)"; break;
              case 16: this.ParameterNameAndUnit = "Minimal Stomatal Resistance(s m-1)"; break;
              case 17: this.ParameterNameAndUnit = "Wilting Point*(Proportion)"; break;
              case 18: this.ParameterNameAndUnit = "Solar parameter in canopy conductance(Proportion)"; break;
              case 19: this.ParameterNameAndUnit = "Temperature parameter in canopy(Proportion)"; break;
              case 20: this.ParameterNameAndUnit = "Humidity parameter in canopy conductance(Proportion)"; break;
              case 21: this.ParameterNameAndUnit = "Soil moisture parameter in canopy conductance(Proportion)"; break;
              case 22: this.ParameterNameAndUnit = "Soil Moisture ***(kg m-3)"; break;
              case 23: this.ParameterNameAndUnit = "Column-Integrated Soil Water ***(kg m-2)"; break;
              case 24: this.ParameterNameAndUnit = "Heat Flux(W m-2)"; break;
              case 25: this.ParameterNameAndUnit = "Volumetric Soil Moisture(m3 m-3)"; break;
              case 26: this.ParameterNameAndUnit = "Wilting Point(kg m-3)"; break;
              case 27: this.ParameterNameAndUnit = "Volumetric Wilting Point(m3 m-3)"; break;
              case 28: this.ParameterNameAndUnit = "Leaf Area Index(Numeric)"; break;
              case 29: this.ParameterNameAndUnit = "Evergreen Forest(Numeric)"; break;
              case 30: this.ParameterNameAndUnit = "Deciduous Forest(Numeric)"; break;
              case 31: this.ParameterNameAndUnit = "Normalized Differential Vegetation Index (NDVI)(Numeric)"; break;
              case 32: this.ParameterNameAndUnit = "Root Depth of Vegetation(m)"; break;
              case 192: this.ParameterNameAndUnit = "Volumetric Soil Moisture Content(Fraction)"; break;
              case 193: this.ParameterNameAndUnit = "Ground Heat Flux(W m-2)"; break;
              case 194: this.ParameterNameAndUnit = "Moisture Availability(%)"; break;
              case 195: this.ParameterNameAndUnit = "Exchange Coefficient((kg m-3) (m s-1))"; break;
              case 196: this.ParameterNameAndUnit = "Plant Canopy Surface Water(kg m-2)"; break;
              case 197: this.ParameterNameAndUnit = "Blackadars Mixing Length Scale(m)"; break;
              case 198: this.ParameterNameAndUnit = "Vegetation Type(Integer (0-13))"; break;
              case 199: this.ParameterNameAndUnit = "Canopy Conductance(m s-1)"; break;
              case 200: this.ParameterNameAndUnit = "Minimal Stomatal Resistance(s m-1)"; break;
              case 201: this.ParameterNameAndUnit = "Wilting Point(Fraction)"; break;
              case 202: this.ParameterNameAndUnit = "Solar parameter in canopy conductance(Fraction)"; break;
              case 203: this.ParameterNameAndUnit = "Temperature parameter in canopy conductance(Fraction)"; break;
              case 204: this.ParameterNameAndUnit = "Humidity parameter in canopy conductance(Fraction)"; break;
              case 205: this.ParameterNameAndUnit = "Soil moisture parameter in canopy conductance(Fraction)"; break;
              case 206: this.ParameterNameAndUnit = "Rate of water dropping from canopy to ground()"; break;
              case 207: this.ParameterNameAndUnit = "Ice-free water surface(%)"; break;
              case 208: this.ParameterNameAndUnit = "Surface exchange coefficients for T and Q divided by delta z(m s-1)"; break;
              case 209: this.ParameterNameAndUnit = "Surface exchange coefficients for U and V divided by delta z(m s-1)"; break;
              case 210: this.ParameterNameAndUnit = "Vegetation canopy temperature(K)"; break;
              case 211: this.ParameterNameAndUnit = "Surface water storage(Kg m-2)"; break;
              case 212: this.ParameterNameAndUnit = "Liquid soil moisture content (non-frozen)(Kg m-2)"; break;
              case 213: this.ParameterNameAndUnit = "Open water evaporation (standing water)(W m-2)"; break;
              case 214: this.ParameterNameAndUnit = "Groundwater recharge(Kg m-2)"; break;
              case 215: this.ParameterNameAndUnit = "Flood plain recharge(Kg m-2)"; break;
              case 216: this.ParameterNameAndUnit = "Roughness length for heat(m)"; break;
              case 217: this.ParameterNameAndUnit = "Normalized Difference Vegetation Index()"; break;
              case 218: this.ParameterNameAndUnit = "Land-sea coverage (nearest neighbor) [land=1,sea=0]()"; break;
              case 219: this.ParameterNameAndUnit = "Asymptotic mixing length scale(m)"; break;
              case 220: this.ParameterNameAndUnit = "Water vapor added by precip assimilation(Kg m-2)"; break;
              case 221: this.ParameterNameAndUnit = "Water condensate added by precip assimilation(Kg m-2)"; break;
              case 222: this.ParameterNameAndUnit = "Water Vapor Flux Convergance (Vertical Int)(Kg m-2)"; break;
              case 223: this.ParameterNameAndUnit = "Water Condensate Flux Convergance (Vertical Int)(Kg m-2)"; break;
              case 224: this.ParameterNameAndUnit = "Water Vapor Zonal Flux (Vertical Int)(Kg m-2)"; break;
              case 225: this.ParameterNameAndUnit = "Water Vapor Meridional Flux (Vertical Int)(Kg m-2)"; break;
              case 226: this.ParameterNameAndUnit = "Water Condensate Zonal Flux (Vertical Int)(Kg m-2)"; break;
              case 227: this.ParameterNameAndUnit = "Water Condensate Meridional Flux (Vertical Int)(Kg m-2)"; break;
              case 228: this.ParameterNameAndUnit = "Aerodynamic conductance(m s-1)"; break;
              case 229: this.ParameterNameAndUnit = "Canopy water evaporation(W m-2)"; break;
              case 230: this.ParameterNameAndUnit = "Transpiration(W m-2)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 1) { // Agricultural/aquacultural special products
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 192: this.ParameterNameAndUnit = "Cold Advisory for Newborn Livestock()"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 3) { // Soil
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Soil Type(See Table 4.213)"; break;
              case 1: this.ParameterNameAndUnit = "Upper Layer Soil Temperature*(K)"; break;
              case 2: this.ParameterNameAndUnit = "Upper Layer Soil Moisture*(kg m-3)"; break;
              case 3: this.ParameterNameAndUnit = "Lower Layer Soil Moisture*(kg m-3)"; break;
              case 4: this.ParameterNameAndUnit = "Bottom Layer Soil Temperature*(K)"; break;
              case 5: this.ParameterNameAndUnit = "Liquid Volumetric Soil Moisture (non-frozen)**(Proportion)"; break;
              case 6: this.ParameterNameAndUnit = "Number of Soil Layers in Root Zone(Numeric)"; break;
              case 7: this.ParameterNameAndUnit = "Transpiration Stress-onset (soil moisture)**(Proportion)"; break;
              case 8: this.ParameterNameAndUnit = "Direct Evaporation Cease (soil moisture)**(Proportion)"; break;
              case 9: this.ParameterNameAndUnit = "Soil Porosity**(Proportion)"; break;
              case 10: this.ParameterNameAndUnit = "Liquid Volumetric Soil Moisture (Non-Frozen)(m3 m-3)"; break;
              case 11: this.ParameterNameAndUnit = "Volumetric Transpiration Stree-Onset(Soil Moisture)(m3 m-3)"; break;
              case 12: this.ParameterNameAndUnit = "Transpiration Stree-Onset(Soil Moisture)(kg m-3)"; break;
              case 13: this.ParameterNameAndUnit = "Volumetric Direct Evaporation Cease(Soil Moisture)(m3 m-3)"; break;
              case 14: this.ParameterNameAndUnit = "Direct Evaporation Cease(Soil Moisture)(kg m-3)"; break;
              case 15: this.ParameterNameAndUnit = "Soil Porosity(m3 m-3)"; break;
              case 16: this.ParameterNameAndUnit = "Volumetric Saturation Of Soil Moisture(m3 m-3)"; break;
              case 17: this.ParameterNameAndUnit = "Saturation Of Soil Moisture(kg m-3)"; break;
              case 18: this.ParameterNameAndUnit = "Soil Temperature(K)"; break;
              case 19: this.ParameterNameAndUnit = "Soil Moisture(kg m-3)"; break;
              case 20: this.ParameterNameAndUnit = "Column-Integrated Soil Moisture(kg m-2)"; break;
              case 21: this.ParameterNameAndUnit = "Soil Ice(kg m-3)"; break;
              case 22: this.ParameterNameAndUnit = "Column-Integrated Soil Ice(kg m-2)"; break;
              case 192: this.ParameterNameAndUnit = "Liquid Volumetric Soil Moisture (non Frozen)(Proportion)"; break;
              case 193: this.ParameterNameAndUnit = "Number of Soil Layers in Root Zone(non-dim)"; break;
              case 194: this.ParameterNameAndUnit = "Surface Slope Type(Index)"; break;
              case 195: this.ParameterNameAndUnit = "Transpiration Stress-onset (soil moisture)(Proportion)"; break;
              case 196: this.ParameterNameAndUnit = "Direct Evaporation Cease (soil moisture)(Proportion)"; break;
              case 197: this.ParameterNameAndUnit = "Soil Porosity(Proportion)"; break;
              case 198: this.ParameterNameAndUnit = "Direct Evaporation from Bare Soil(W m-2)"; break;
              case 199: this.ParameterNameAndUnit = "Land Surface Precipitation Accumulation(kg m-2)"; break;
              case 200: this.ParameterNameAndUnit = "Bare Soil Surface Skin temperature(K)"; break;
              case 201: this.ParameterNameAndUnit = "Average Surface Skin Temperature(K)"; break;
              case 202: this.ParameterNameAndUnit = "Effective Radiative Skin Temperature(K)"; break;
              case 203: this.ParameterNameAndUnit = "Field Capacity(Fraction)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 4) { // Fire Weather
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Fire Outlook(See Table 4.224)"; break;
              case 1: this.ParameterNameAndUnit = "Fire Outlook Due to Dry Thunderstorm(See Table 4.224)"; break;
              case 2: this.ParameterNameAndUnit = "Haines Index(Numeric)"; break;
              case 3: this.ParameterNameAndUnit = "Fire Burned Area(%)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
        }
        else if (this.DisciplineOfProcessedData === 3) { // Space
          if (this.CategoryOfParametersByProductDiscipline === 0) { // Image format
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Scaled Radiance(Numeric)"; break;
              case 1: this.ParameterNameAndUnit = "Scaled Albedo(Numeric)"; break;
              case 2: this.ParameterNameAndUnit = "Scaled Brightness Temperature(Numeric)"; break;
              case 3: this.ParameterNameAndUnit = "Scaled Precipitable Water(Numeric)"; break;
              case 4: this.ParameterNameAndUnit = "Scaled Lifted Index(Numeric)"; break;
              case 5: this.ParameterNameAndUnit = "Scaled Cloud Top Pressure(Numeric)"; break;
              case 6: this.ParameterNameAndUnit = "Scaled Skin Temperature(Numeric)"; break;
              case 7: this.ParameterNameAndUnit = "Cloud Mask(See Table 4.217)"; break;
              case 8: this.ParameterNameAndUnit = "Pixel scene type(See Table 4.218)"; break;
              case 9: this.ParameterNameAndUnit = "Fire Detection Indicator(See Table 4.223)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 1) { // Quantitative
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Estimated Precipitation(kg m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Instantaneous Rain Rate(kg m-2 s-1)"; break;
              case 2: this.ParameterNameAndUnit = "Cloud Top Height(m)"; break;
              case 3: this.ParameterNameAndUnit = "Cloud Top Height Quality Indicator(Code table 4.219)"; break;
              case 4: this.ParameterNameAndUnit = "Estimated u-Component of Wind(m s-1)"; break;
              case 5: this.ParameterNameAndUnit = "Estimated v-Component of Wind(m s-1)"; break;
              case 6: this.ParameterNameAndUnit = "Number Of Pixels Used(Numeric)"; break;
              case 7: this.ParameterNameAndUnit = "Solar Zenith Angle()"; break;
              case 8: this.ParameterNameAndUnit = "Relative Azimuth Angle()"; break;
              case 9: this.ParameterNameAndUnit = "Reflectance in 0.6 Micron Channel(%)"; break;
              case 10: this.ParameterNameAndUnit = "Reflectance in 0.8 Micron Channel(%)"; break;
              case 11: this.ParameterNameAndUnit = "Reflectance in 1.6 Micron Channel(%)"; break;
              case 12: this.ParameterNameAndUnit = "Reflectance in 3.9 Micron Channel(%)"; break;
              case 13: this.ParameterNameAndUnit = "Atmospheric Divergence(s-1)"; break;
              case 14: this.ParameterNameAndUnit = "Cloudy Brightness Temperature(K)"; break;
              case 15: this.ParameterNameAndUnit = "Clear Sky Brightness Temperature(K)"; break;
              case 16: this.ParameterNameAndUnit = "Cloudy Radiance (with respect to wave number)(W m-1 sr-1)"; break;
              case 17: this.ParameterNameAndUnit = "Clear Sky Radiance (with respect to wave number)(W m-1 sr-1)"; break;
              case 19: this.ParameterNameAndUnit = "Wind Speed(m s-1)"; break;
              case 20: this.ParameterNameAndUnit = "Aerosol Optical Thickness at 0.635 m()"; break;
              case 21: this.ParameterNameAndUnit = "Aerosol Optical Thickness at 0.810 m()"; break;
              case 22: this.ParameterNameAndUnit = "Aerosol Optical Thickness at 1.640 m()"; break;
              case 23: this.ParameterNameAndUnit = "Angstrom Coefficient()"; break;
              case 192: this.ParameterNameAndUnit = "Scatterometer Estimated U Wind Component(m s-1)"; break;
              case 193: this.ParameterNameAndUnit = "Scatterometer Estimated V Wind Component(m s-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 192) { // Forecast Satellite Imagery
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 12, Channel 2(K)"; break;
              case 1: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 12, Channel 3(K)"; break;
              case 2: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 12, Channel 4(K)"; break;
              case 3: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 12, Channel 6(K)"; break;
              case 4: this.ParameterNameAndUnit = "Simulated Brightness Counts for GOES 12, Channel 3(Byte)"; break;
              case 5: this.ParameterNameAndUnit = "Simulated Brightness Counts for GOES 12, Channel 4(Byte)"; break;
              case 6: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 11, Channel 2(K)"; break;
              case 7: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 11, Channel 3(K)"; break;
              case 8: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 11, Channel 4(K)"; break;
              case 9: this.ParameterNameAndUnit = "Simulated Brightness Temperature for GOES 11, Channel 5(K)"; break;
              case 10: this.ParameterNameAndUnit = "Simulated Brightness Temperature for AMSRE on Aqua, Channel 9(K)"; break;
              case 11: this.ParameterNameAndUnit = "Simulated Brightness Temperature for AMSRE on Aqua, Channel 10(K)"; break;
              case 12: this.ParameterNameAndUnit = "Simulated Brightness Temperature for AMSRE on Aqua, Channel 11(K)"; break;
              case 13: this.ParameterNameAndUnit = "Simulated Brightness Temperature for AMSRE on Aqua, Channel 12(K)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
        }

        else if (this.DisciplineOfProcessedData === 4) { // Space Weather
          if (this.CategoryOfParametersByProductDiscipline === 0) { // Temperature
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Temperature(K)"; break;
              case 1: this.ParameterNameAndUnit = "Electron Temperature(K)"; break;
              case 2: this.ParameterNameAndUnit = "Proton Temperature(K)"; break;
              case 3: this.ParameterNameAndUnit = "Ion Temperature(K)"; break;
              case 4: this.ParameterNameAndUnit = "Parallel Temperature(K)"; break;
              case 5: this.ParameterNameAndUnit = "Perpendicular Temperature(K)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 1) { // Momentum
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Velocity Magnitude (Speed)(m s-1)"; break;
              case 1: this.ParameterNameAndUnit = "1st Vector Component of Velocity (Coordinate system dependent)(m s-1)"; break;
              case 2: this.ParameterNameAndUnit = "2nd Vector Component of Velocity (Coordinate system dependent)(m s-1)"; break;
              case 3: this.ParameterNameAndUnit = "3rd Vector Component of Velocity (Coordinate system dependent)(m s-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 2) { // Charged Particle Mass and Number
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Particle Number Density(m-3)"; break;
              case 1: this.ParameterNameAndUnit = "Electron Density(m-3)"; break;
              case 2: this.ParameterNameAndUnit = "Proton Density(m-3)"; break;
              case 3: this.ParameterNameAndUnit = "Ion Density(m-3)"; break;
              case 4: this.ParameterNameAndUnit = "Vertical Electron Content(m-2)"; break;
              case 5: this.ParameterNameAndUnit = "HF Absorption Frequency(Hz)"; break;
              case 6: this.ParameterNameAndUnit = "HF Absorption(dB)"; break;
              case 7: this.ParameterNameAndUnit = "Spread F(m)"; break;
              case 8: this.ParameterNameAndUnit = "h'F(m)"; break;
              case 9: this.ParameterNameAndUnit = "Critical Frequency(Hz)"; break;
              case 10: this.ParameterNameAndUnit = "Scintillation(Numeric)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 3) { // Electric and Magnetic Fields
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Magnetic Field Magnitude(T)"; break;
              case 1: this.ParameterNameAndUnit = "1st Vector Component of Magnetic Field(T)"; break;
              case 2: this.ParameterNameAndUnit = "2nd Vector Component of Magnetic Field(T)"; break;
              case 3: this.ParameterNameAndUnit = "3rd Vector Component of Magnetic Field(T)"; break;
              case 4: this.ParameterNameAndUnit = "Electric Field Magnitude(V m-1)"; break;
              case 5: this.ParameterNameAndUnit = "1st Vector Component of Electric Field(V m-1)"; break;
              case 6: this.ParameterNameAndUnit = "2nd Vector Component of Electric Field(V m-1)"; break;
              case 7: this.ParameterNameAndUnit = "3rd Vector Component of Electric Field(V m-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 4) { // Energetic Particles
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Proton Flux (Differential)((m2 s sr eV)-1)"; break;
              case 1: this.ParameterNameAndUnit = "Proton Flux (Integral)((m2 s sr)-1)"; break;
              case 2: this.ParameterNameAndUnit = "Electron Flux (Differential)((m2 s sr eV)-1)"; break;
              case 3: this.ParameterNameAndUnit = "Electron Flux (Integral)((m2 s sr)-1)"; break;
              case 4: this.ParameterNameAndUnit = "Heavy Ion Flux (Differential)((m2 s sr eV / nuc)-1)"; break;
              case 5: this.ParameterNameAndUnit = "Heavy Ion Flux (iIntegral)((m2 s sr)-1)"; break;
              case 6: this.ParameterNameAndUnit = "Cosmic Ray Neutron Flux(h-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }

          else if (this.CategoryOfParametersByProductDiscipline === 5) { // Waves
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 6) { // Solar Electromagnetic Emissions
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Integrated Solar Irradiance(W m-2)"; break;
              case 1: this.ParameterNameAndUnit = "Solar X-ray Flux (XRS Long)(W m-2)"; break;
              case 2: this.ParameterNameAndUnit = "Solar X-ray Flux (XRS Short)(W m-2)"; break;
              case 3: this.ParameterNameAndUnit = "Solar EUV Irradiance(W m-2)"; break;
              case 4: this.ParameterNameAndUnit = "Solar Spectral Irradiance(W m-2 nm-1)"; break;
              case 5: this.ParameterNameAndUnit = "F10.7(W m-2 Hz-1)"; break;
              case 6: this.ParameterNameAndUnit = "Solar Radio Emissions(W m-2 Hz-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 7) { // Terrestrial Electromagnetic Emissions
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Limb Intensity(m-2 s-1)"; break;
              case 1: this.ParameterNameAndUnit = "Disk Intensity(m-2 s-1)"; break;
              case 2: this.ParameterNameAndUnit = "Disk Intensity Day(m-2 s-1)"; break;
              case 3: this.ParameterNameAndUnit = "Disk Intensity Night(m-2 s-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 8) { // Imagery
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "X-Ray Radiance(W sr-1 m-2)"; break;
              case 1: this.ParameterNameAndUnit = "EUV Radiance(W sr-1 m-2)"; break;
              case 2: this.ParameterNameAndUnit = "H-Alpha Radiance(W sr-1 m-2)"; break;
              case 3: this.ParameterNameAndUnit = "White Light Radiance(W sr-1 m-2)"; break;
              case 4: this.ParameterNameAndUnit = "CaII-K Radiance(W sr-1 m-2)"; break;
              case 5: this.ParameterNameAndUnit = "White Light Coronagraph Radiance(W sr-1 m-2)"; break;
              case 6: this.ParameterNameAndUnit = "Heliospheric Radiance(W sr-1 m-2)"; break;
              case 7: this.ParameterNameAndUnit = "Thematic Mask(Numeric)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 9) { // Ion-Neutral Coupling
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Pedersen Conductivity(S m-1)"; break;
              case 1: this.ParameterNameAndUnit = "Hall Conductivity(S m-1)"; break;
              case 2: this.ParameterNameAndUnit = "Parallel Conductivity(S m-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
        }
        else if (this.DisciplineOfProcessedData === 10) { // Oceanographic
          if (this.CategoryOfParametersByProductDiscipline === 0) { // Waves
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Wave Spectra (1)(-)"; break;
              case 1: this.ParameterNameAndUnit = "Wave Spectra (2)(-)"; break;
              case 2: this.ParameterNameAndUnit = "Wave Spectra (3)(-)"; break;
              case 3: this.ParameterNameAndUnit = "Significant Height of Combined Wind Waves and Swell(m)"; break;
              case 4: this.ParameterNameAndUnit = "Direction of Wind Waves(degree true)"; break;
              case 5: this.ParameterNameAndUnit = "Significant Height of Wind Waves(m)"; break;
              case 6: this.ParameterNameAndUnit = "Mean Period of Wind Waves(s)"; break;
              case 7: this.ParameterNameAndUnit = "Direction of Swell Waves(degree true)"; break;
              case 8: this.ParameterNameAndUnit = "Significant Height of Swell Waves(m)"; break;
              case 9: this.ParameterNameAndUnit = "Mean Period of Swell Waves(s)"; break;
              case 10: this.ParameterNameAndUnit = "Primary Wave Direction(degree true)"; break;
              case 11: this.ParameterNameAndUnit = "Primary Wave Mean Period(s)"; break;
              case 12: this.ParameterNameAndUnit = "Secondary Wave Direction(degree true)"; break;
              case 13: this.ParameterNameAndUnit = "Secondary Wave Mean Period(s)"; break;
              case 14: this.ParameterNameAndUnit = "Direction of Combined Wind Waves and Swell(degree true)"; break;
              case 15: this.ParameterNameAndUnit = "Mean Period of Combined Wind Waves and Swell(s)"; break;
              case 16: this.ParameterNameAndUnit = "Coefficient of Drag With Waves(-)"; break;
              case 17: this.ParameterNameAndUnit = "Friction Velocity(m s-1)"; break;
              case 18: this.ParameterNameAndUnit = "Wave Stress(N m-2)"; break;
              case 19: this.ParameterNameAndUnit = "Normalised Waves Stress(-)"; break;
              case 20: this.ParameterNameAndUnit = "Mean Square Slope of Waves(-)"; break;
              case 21: this.ParameterNameAndUnit = "U-component Surface Stokes Drift(m s-1)"; break;
              case 22: this.ParameterNameAndUnit = "V-component Surface Stokes Drift(m s-1)"; break;
              case 23: this.ParameterNameAndUnit = "Period of Maximum Individual Wave Height(s)"; break;
              case 24: this.ParameterNameAndUnit = "Maximum Individual Wave Height(m)"; break;
              case 25: this.ParameterNameAndUnit = "Inverse Mean Wave Frequency(s)"; break;
              case 26: this.ParameterNameAndUnit = "Inverse Mean Frequency of The Wind Waves(s)"; break;
              case 27: this.ParameterNameAndUnit = "Inverse Mean Frequency of The Total Swell(s)"; break;
              case 28: this.ParameterNameAndUnit = "Mean Zero-Crossing Wave Period(s)"; break;
              case 29: this.ParameterNameAndUnit = "Mean Zero-Crossing Period of The Wind Waves(s)"; break;
              case 30: this.ParameterNameAndUnit = "Mean Zero-Crossing Period of The Total Swell(s)"; break;
              case 31: this.ParameterNameAndUnit = "Wave Directional Width(-)"; break;
              case 32: this.ParameterNameAndUnit = "Directional Width of The Wind Waves(-)"; break;
              case 33: this.ParameterNameAndUnit = "Directional Width of The Total Swell(-)"; break;
              case 34: this.ParameterNameAndUnit = "Peak Wave Period(s)"; break;
              case 35: this.ParameterNameAndUnit = "Peak Period of The Wind Waves(s)"; break;
              case 36: this.ParameterNameAndUnit = "Peak Period of The Total Swell(s)"; break;
              case 37: this.ParameterNameAndUnit = "Altimeter Wave Height(m)"; break;
              case 38: this.ParameterNameAndUnit = "Altimeter Corrected Wave Height(m)"; break;
              case 39: this.ParameterNameAndUnit = "Altimeter Range Relative Correction(-)"; break;
              case 40: this.ParameterNameAndUnit = "10 Metre Neutral Wind Speed Over Waves(m s-1)"; break;
              case 41: this.ParameterNameAndUnit = "10 Metre Wind Direction Over Waves(degree true)"; break;
              case 42: this.ParameterNameAndUnit = "Wave Engery Spectrum(m-2 s rad-1)"; break;
              case 43: this.ParameterNameAndUnit = "Kurtosis of The Sea Surface Elevation Due to Waves(-)"; break;
              case 45: this.ParameterNameAndUnit = "Spectral Peakedness Factor(s-1)"; break;
              case 192: this.ParameterNameAndUnit = "Wave Steepness(proportion)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }

          else if (this.CategoryOfParametersByProductDiscipline === 1) { // Currents
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Current Direction(degree True)"; break;
              case 1: this.ParameterNameAndUnit = "Current Speed(m s-1)"; break;
              case 2: this.ParameterNameAndUnit = "U-Component of Current(m s-1)"; break;
              case 3: this.ParameterNameAndUnit = "V-Component of Current(m s-1)"; break;
              case 192: this.ParameterNameAndUnit = "Ocean Mixed Layer U Velocity(m s-1)"; break;
              case 193: this.ParameterNameAndUnit = "Ocean Mixed Layer V Velocity(m s-1)"; break;
              case 194: this.ParameterNameAndUnit = "Barotropic U velocity(m s-1)"; break;
              case 195: this.ParameterNameAndUnit = "Barotropic V velocity(m s-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }

          else if (this.CategoryOfParametersByProductDiscipline === 2) { // Ice
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Ice Cover(Proportion)"; break;
              case 1: this.ParameterNameAndUnit = "Ice Thickness(m)"; break;
              case 2: this.ParameterNameAndUnit = "Direction of Ice Drift(degree True)"; break;
              case 3: this.ParameterNameAndUnit = "Speed of Ice Drift(m s-1)"; break;
              case 4: this.ParameterNameAndUnit = "U-Component of Ice Drift(m s-1)"; break;
              case 5: this.ParameterNameAndUnit = "V-Component of Ice Drift(m s-1)"; break;
              case 6: this.ParameterNameAndUnit = "Ice Growth Rate(m s-1)"; break;
              case 7: this.ParameterNameAndUnit = "Ice Divergence(s-1)"; break;
              case 8: this.ParameterNameAndUnit = "Ice Temperature(K)"; break;
              case 9: this.ParameterNameAndUnit = "Ice Internal Pressure(Pa m)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 3) { // Surface Properties
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Water Temperature(K)"; break;
              case 1: this.ParameterNameAndUnit = "Deviation of Sea Level from Mean(m)"; break;
              case 192: this.ParameterNameAndUnit = "Hurricane Storm Surge(m)"; break;
              case 193: this.ParameterNameAndUnit = "Extra Tropical Storm Surge(m)"; break;
              case 194: this.ParameterNameAndUnit = "Ocean Surface Elevation Relative to Geoid(m)"; break;
              case 195: this.ParameterNameAndUnit = "Sea Surface Height Relative to Geoid(m)"; break;
              case 196: this.ParameterNameAndUnit = "Ocean Mixed Layer Potential Density (Reference 2000m)(kg m-3)"; break;
              case 197: this.ParameterNameAndUnit = "Net Air-Ocean Heat Flux(W m-2)"; break;
              case 198: this.ParameterNameAndUnit = "Assimilative Heat Flux(W m-2)"; break;
              case 199: this.ParameterNameAndUnit = "Surface Temperature Trend(degree per day)"; break;
              case 200: this.ParameterNameAndUnit = "Surface Salinity Trend(psu per day)"; break;
              case 201: this.ParameterNameAndUnit = "Kinetic Energy(J kg-1)"; break;
              case 202: this.ParameterNameAndUnit = "Salt Flux(kg m-2s-1)"; break;
              case 242: this.ParameterNameAndUnit = "20% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 243: this.ParameterNameAndUnit = "30% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 244: this.ParameterNameAndUnit = "40% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 245: this.ParameterNameAndUnit = "50% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 246: this.ParameterNameAndUnit = "60% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 247: this.ParameterNameAndUnit = "70% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 248: this.ParameterNameAndUnit = "80% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 249: this.ParameterNameAndUnit = "90% Tropical Cyclone Storm Surge Exceedance(m)"; break;
              case 250: this.ParameterNameAndUnit = "Extra Tropical Storm Surge Combined Surge and Tide(m)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 4) { // Sub-surface Properties
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Main Thermocline Depth(m)"; break;
              case 1: this.ParameterNameAndUnit = "Main Thermocline Anomaly(m)"; break;
              case 2: this.ParameterNameAndUnit = "Transient Thermocline Depth(m)"; break;
              case 3: this.ParameterNameAndUnit = "Salinity(kg kg-1)"; break;
              case 4: this.ParameterNameAndUnit = "Ocean Vertical Heat Diffusivity(m2 s-1)"; break;
              case 5: this.ParameterNameAndUnit = "Ocean Vertical Salt Diffusivity(m2 s-1)"; break;
              case 6: this.ParameterNameAndUnit = "Ocean Vertical Momentum Diffusivity(m2 s-1)"; break;
              case 7: this.ParameterNameAndUnit = "Bathymetry(m)"; break;
              case 11: this.ParameterNameAndUnit = "Shape Factor With Respect To Salinity Profile()"; break;
              case 12: this.ParameterNameAndUnit = "Shape Factor With Respect To Temperature Profile In Thermocline()"; break;
              case 13: this.ParameterNameAndUnit = "Attenuation Coefficient Of Water With Respect to Solar Radiation(m-1)"; break;
              case 14: this.ParameterNameAndUnit = "Water Depth(m)"; break;
              case 15: this.ParameterNameAndUnit = "Water Temperature(K)"; break;
              case 192: this.ParameterNameAndUnit = "3-D Temperature(c)"; break;
              case 193: this.ParameterNameAndUnit = "3-D Salinity(psu)"; break;
              case 194: this.ParameterNameAndUnit = "Barotropic Kinectic Energy(J kg-1)"; break;
              case 195: this.ParameterNameAndUnit = "Geometric Depth Below Sea Surface(m)"; break;
              case 196: this.ParameterNameAndUnit = "Interface Depths(m)"; break;
              case 197: this.ParameterNameAndUnit = "Ocean Heat Content(J m-2)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
          else if (this.CategoryOfParametersByProductDiscipline === 191) { // Miscellaneous
            switch (this.ParameterNumberByProductDisciplineAndParameterCategory) {
              case 0: this.ParameterNameAndUnit = "Seconds Prior To Initial Reference Time (Defined In Section 1)(s)"; break;
              case 1: this.ParameterNameAndUnit = "Meridional Overturning Stream Function(m3 s-1)"; break;
              case 255: this.ParameterNameAndUnit = "Missing"; break;
              default: this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory); break;
            }
          }
        }
        else {
          this.ParameterNameAndUnit = nf0(this.ParameterNumberByProductDisciplineAndParameterCategory, 0);
        }
        println(this.ParameterNameAndUnit);

        var /* float */ DayPortion = 0;

        print("Indicator of unit of time range:\t");
        this.IndicatorOfUnitOfTimeRange = SectionNumbers[18];
        switch (this.IndicatorOfUnitOfTimeRange) {
          case 0: println("Minute"); DayPortion = 1.0 / 60.0; break;
          case 1: println("Hour"); DayPortion = 1; break;
          case 2: println("Day"); DayPortion = 24; break;
          case 3: println("Month"); DayPortion = 30.5 * 24; break;
          case 4: println("Year"); DayPortion = 365 * 24; break;
          case 5: println("Decade (10 years)"); DayPortion = 10 * 365 * 24; break;
          case 6: println("Normal (30 years)"); DayPortion = 30 * 365 * 24; break;
          case 7: println("Century (100 years)"); DayPortion = 100 * 365 * 24; break;
          case 10: println("3 hours"); DayPortion = 3; break;
          case 11: println("6 hours"); DayPortion = 6; break;
          case 12: println("12 hours"); DayPortion = 12; break;
          case 13: println("Second"); DayPortion = 1.0 / 3600.0; break;
          case 255: println("Missing"); DayPortion = 0; break;
          default: println(this.IndicatorOfUnitOfTimeRange); break;
        }

        print("Forecast time in defined units:\t");
        this.ForecastTimeInDefinedUnits = U_NUMx4(SectionNumbers[19], SectionNumbers[20], SectionNumbers[21], SectionNumbers[22]);

        if (this.ProductDefinitionTemplateNumber === 8) { // Average, accumulation, extreme values or other statistically processed values at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.8)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[50], SectionNumbers[51], SectionNumbers[52], SectionNumbers[53]);
        }
        else if (this.ProductDefinitionTemplateNumber === 9) { // Probability forecasts at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.9)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[63], SectionNumbers[64], SectionNumbers[65], SectionNumbers[66]);
        }
        else if (this.ProductDefinitionTemplateNumber === 10) { // Percentile forecasts at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval. (see Template 4.10)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[51], SectionNumbers[52], SectionNumbers[53], SectionNumbers[54]);
        }
        else if (this.ProductDefinitionTemplateNumber === 11) { // Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.11)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[53], SectionNumbers[54], SectionNumbers[55], SectionNumbers[56]);
        }
        else if (this.ProductDefinitionTemplateNumber === 12) { // Derived forecasts based on all ensemble members at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.12)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[52], SectionNumbers[53], SectionNumbers[54], SectionNumbers[55]);
        }
        else if (this.ProductDefinitionTemplateNumber === 13) { // Derived forecasts based on a cluster of ensemble members over a rectangular area at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.13)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[84], SectionNumbers[85], SectionNumbers[86], SectionNumbers[87]);
        }
        else if (this.ProductDefinitionTemplateNumber === 14) { // Derived forecasts based on a cluster of ensemble members over a circular area at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval. (see Template 4.14)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[80], SectionNumbers[81], SectionNumbers[82], SectionNumbers[83]);
        }
        else if (this.ProductDefinitionTemplateNumber === 42) { // Average, accumulation, and/or extreme values or other statistically processed values at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval for atmospheric chemical constituents. (see Template 4.42)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[52], SectionNumbers[53], SectionNumbers[54], SectionNumbers[55]);
        }
        else if (this.ProductDefinitionTemplateNumber === 43) { // Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval for atmospheric chemical constituents. (see Template 4.43)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[55], SectionNumbers[56], SectionNumbers[57], SectionNumbers[58]);
        }
        else if (this.ProductDefinitionTemplateNumber === 46) { // Average, accumulation, and/or extreme values or other statistically processed values at a horizontal level or in a horizontal layer in a continuous or non-continuous time interval for aerosol. (see Template 4.46)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[63], SectionNumbers[64], SectionNumbers[65], SectionNumbers[66]);
        }
        else if (this.ProductDefinitionTemplateNumber === 47) { // Individual ensemble forecast, control and perturbed, at a horizontal level or in a horizontal layer, in a continuous or non-continuous time interval for aerosol. (see Template 4.47)
          this.ForecastTimeInDefinedUnits += U_NUMx4(SectionNumbers[66], SectionNumbers[67], SectionNumbers[68], SectionNumbers[69]);
        }
        println(this.ForecastTimeInDefinedUnits);

        this.ForecastConvertedTime = this.ForecastTimeInDefinedUnits * DayPortion;

        print("Type of first fixed surface:\t");
        this.TypeOfFirstFixedSurface = SectionNumbers[23];
        switch (this.TypeOfFirstFixedSurface) {
          case 1: println("Ground or Water Surface"); break;
          case 2: println("Cloud Base Level"); break;
          case 3: println("Level of Cloud Tops"); break;
          case 4: println("Level of 0o C Isotherm"); break;
          case 5: println("Level of Adiabatic Condensation Lifted from the Surface"); break;
          case 6: println("Maximum Wind Level"); break;
          case 7: println("Tropopause"); break;
          case 8: println("Nominal Top of the Atmosphere"); break;
          case 9: println("Sea Bottom"); break;
          case 10: println("Entire Atmosphere"); break;
          case 11: println("Cumulonimbus Base (CB)"); break;
          case 12: println("Cumulonimbus Top (CT)"); break;
          case 20: println("Isothermal Level"); break;
          case 100: println("Isobaric Surface"); break;
          case 101: println("Mean Sea Level"); break;
          case 102: println("Specific Altitude Above Mean Sea Level"); break;
          case 103: println("Specified Height Level Above Ground"); break;
          case 104: println("Sigma Level"); break;
          case 105: println("Hybrid Level"); break;
          case 106: println("Depth Below Land Surface"); break;
          case 107: println("Isentropic (theta) Level"); break;
          case 108: println("Level at Specified Pressure Difference from Ground to Level"); break;
          case 109: println("Potential Vorticity Surface"); break;
          case 111: println("Eta Level"); break;
          case 113: println("Logarithmic Hybrid Level"); break;
          case 114: println("Snow Level"); break;
          case 117: println("Mixed Layer Depth"); break;
          case 118: println("Hybrid Height Level"); break;
          case 119: println("Hybrid Pressure Level"); break;
          case 150: println("Generalized Vertical Height Coordinate (see Note 5)"); break;
          case 160: println("Depth Below Sea Level"); break;
          case 161: println("Depth Below Water Surface"); break;
          case 162: println("Lake or River Bottom"); break;
          case 163: println("Bottom Of Sediment Layer"); break;
          case 164: println("Bottom Of Thermally Active Sediment Layer"); break;
          case 165: println("Bottom Of Sediment Layer Penetrated By Thermal Wave"); break;
          case 166: println("Maxing Layer"); break;
          case 200: println("Entire atmosphere (considered as a single layer)"); break;
          case 201: println("Entire ocean (considered as a single layer)"); break;
          case 204: println("Highest tropospheric freezing level"); break;
          case 206: println("Grid scale cloud bottom level"); break;
          case 207: println("Grid scale cloud top level"); break;
          case 209: println("Boundary layer cloud bottom level"); break;
          case 210: println("Boundary layer cloud top level"); break;
          case 211: println("Boundary layer cloud layer"); break;
          case 212: println("Low cloud bottom level"); break;
          case 213: println("Low cloud top level"); break;
          case 214: println("Low cloud layer"); break;
          case 215: println("Cloud ceiling"); break;
          case 220: println("Planetary Boundary Layer"); break;
          case 221: println("Layer Between Two Hybrid Levels"); break;
          case 222: println("Middle cloud bottom level"); break;
          case 223: println("Middle cloud top level"); break;
          case 224: println("Middle cloud layer"); break;
          case 232: println("High cloud bottom level"); break;
          case 233: println("High cloud top level"); break;
          case 234: println("High cloud layer"); break;
          case 235: println("Ocean Isotherm Level (1/10  C)"); break;
          case 236: println("Layer between two depths below ocean surface"); break;
          case 237: println("Bottom of Ocean Mixed Layer (m)"); break;
          case 238: println("Bottom of Ocean Isothermal Layer (m)"); break;
          case 239: println("Layer Ocean Surface and 26C Ocean Isothermal Level"); break;
          case 240: println("Ocean Mixed Layer"); break;
          case 241: println("Ordered Sequence of Data"); break;
          case 242: println("Convective cloud bottom level"); break;
          case 243: println("Convective cloud top level"); break;
          case 244: println("Convective cloud layer"); break;
          case 245: println("Lowest level of the wet bulb zero"); break;
          case 246: println("Maximum equivalent potential temperature level"); break;
          case 247: println("Equilibrium level"); break;
          case 248: println("Shallow convective cloud bottom level"); break;
          case 249: println("Shallow convective cloud top level"); break;
          case 251: println("Deep convective cloud bottom level"); break;
          case 252: println("Deep convective cloud top level"); break;
          case 253: println("Lowest bottom level of supercooled liquid water layer"); break;
          case 254: println("Highest top level of supercooled liquid water layer"); break;
          case 255: println("Missing"); break;
          default: println(this.TypeOfFirstFixedSurface); break;
        }
      }

      SectionNumbers = this.getGrib2Section(5); // Section 5: Data Representation Section

      if (SectionNumbers.length > 1) {
        print("Number of data points:\t");
        this.NumberOfDataPoints = U_NUMx4(SectionNumbers[6], SectionNumbers[7], SectionNumbers[8], SectionNumbers[9]);
        println(this.NumberOfDataPoints);

        print("Data Representation Template Number:\t");
        this.DataRepresentationTemplateNumber = U_NUMx2(SectionNumbers[10], SectionNumbers[11]);
        switch (this.DataRepresentationTemplateNumber) {
          case 0: println("Grid point data - simple packing"); break;
          case 1: println("Matrix value - simple packing"); break;
          case 2: println("Grid point data - complex packing"); break;
          case 3: println("Grid point data - complex packing and spatial differencing"); break;
          case 4: println("Grid point data – IEEE floating point data"); break;
          case 40: println("Grid point data – JPEG 2000 Code Stream Format"); break;
          case 41: println("Grid point data – Portable Network Graphics (PNG)"); break;
          case 50: println("Spectral data -simple packing"); break;
          case 51: println("Spherical harmonics data - complex packing"); break;
          case 61: println("Grid point data - simple packing with logarithm pre-processing"); break;
          case 65535: println("Missing"); break;
          default: println(this.DataRepresentationTemplateNumber); break;
        }

        print("Reference value (R):\t");
        this.ReferenceValue = IEEE32(IntToBinary32(U_NUMx4(SectionNumbers[12], SectionNumbers[13], SectionNumbers[14], SectionNumbers[15])));
        println(this.ReferenceValue);

        print("Binary Scale Factor (E):\t");
        this.BinaryScaleFactor = S_NUMx2(SectionNumbers[16], SectionNumbers[17]);
        println(this.BinaryScaleFactor);

        print("Decimal Scale Factor (D):\t");
        this.DecimalScaleFactor = S_NUMx2(SectionNumbers[18], SectionNumbers[19]);
        println(this.DecimalScaleFactor);

        print("Number of bits used for each packed value:\t");
        this.NumberOfBitsUsedForEachPackedValue = SectionNumbers[20];
        println(this.NumberOfBitsUsedForEachPackedValue);

        print("Type of original field values:\t");
        JPEG2000_TypeOfOriginalFieldValues = SectionNumbers[21];
        switch (JPEG2000_TypeOfOriginalFieldValues) {
          case 0: println("Floating point"); break;
          case 1: println("Integer"); break;
          case 255: println("Missing"); break;
          default: println(JPEG2000_TypeOfOriginalFieldValues); break;
        }

        // parameters over 21 used in Complex Packings e.g JPEG-2000
        JPEG2000_TypeOfCompression = -1;
        JPEG2000_TargetCompressionRatio = -1;
        if (this.DataRepresentationTemplateNumber === 40) { // Grid point data – JPEG 2000 Code Stream Format

          print("JPEG-2000/Type of Compression:\t");
          JPEG2000_TypeOfCompression = SectionNumbers[22];
          switch (JPEG2000_TypeOfCompression) {
            case 0: println("Lossless"); break;
            case 1: println("Lossy"); break;
            case 255: println("Missing"); break;
            default: println(JPEG2000_TypeOfCompression); break;
          }

          print("JPEG-2000/Target compression ratio (M):\t");
          JPEG2000_TargetCompressionRatio = SectionNumbers[23];
          println(JPEG2000_TargetCompressionRatio);
          //The compression ratio M:1 (e.g. 20:1) specifies that the encoded stream should be less than ((1/M) x depth x number of data points) bits,
          //where depth is specified in octet 20 and number of data points is specified in octets 6-9 of the Data Representation Section.
        }
        else if ((this.DataRepresentationTemplateNumber === 2) || // Grid point data - complex packing
          (this.DataRepresentationTemplateNumber === 3)) { // Grid point data - complex packing and spatial differencing

          print("ComplexPacking/Type of Compression:\t");
          ComplexPacking_GroupSplittingMethodUsed = SectionNumbers[22];
          switch (ComplexPacking_GroupSplittingMethodUsed) {
            case 0: println("Row by row splitting"); break;
            case 1: println("General group splitting"); break;
            case 255: println("Missing"); break;
            default: println(ComplexPacking_GroupSplittingMethodUsed); break;
          }

          print("ComplexPacking/Missing value management used:\t");
          ComplexPacking_MissingValueManagementUsed = SectionNumbers[23];
          switch (ComplexPacking_MissingValueManagementUsed) {
            case 0: println("No explicit missing values included within data values"); break;
            case 1: println("Primary missing values included within data values"); break;
            case 2: println("Primary and secondary missing values included within data values"); break;
            case 255: println("Missing"); break;
            default: println(ComplexPacking_MissingValueManagementUsed); break;
          }

          print("ComplexPacking/Primary missing value substitute:\t");
          ComplexPacking_PrimaryMissingValueSubstitute = IEEE32(IntToBinary32(U_NUMx4(SectionNumbers[24], SectionNumbers[25], SectionNumbers[26], SectionNumbers[27])));
          println(ComplexPacking_PrimaryMissingValueSubstitute);

          print("ComplexPacking/Secondary missing value substitute:\t");
          ComplexPacking_SecondaryMissingValueSubstitute = IEEE32(IntToBinary32(U_NUMx4(SectionNumbers[28], SectionNumbers[29], SectionNumbers[30], SectionNumbers[31])));
          println(ComplexPacking_SecondaryMissingValueSubstitute);

          print("ComplexPacking/Number of groups of data values into which field is split:\t");
          ComplexPacking_NumberOfGroupsOfDataValues = U_NUMx4(SectionNumbers[32], SectionNumbers[33], SectionNumbers[34], SectionNumbers[35]);
          println(ComplexPacking_NumberOfGroupsOfDataValues);

          print("ComplexPacking/Reference for group widths:\t");
          ComplexPacking_ReferenceForGroupWidths = SectionNumbers[36];
          println(ComplexPacking_ReferenceForGroupWidths);

          print("ComplexPacking/Number of bits used for group widths:\t");
          ComplexPacking_NumberOfBitsUsedForGroupWidths = SectionNumbers[37];
          println(ComplexPacking_NumberOfBitsUsedForGroupWidths);

          print("ComplexPacking/Reference for group lengths:\t");
          ComplexPacking_ReferenceForGroupLengths = U_NUMx4(SectionNumbers[38], SectionNumbers[39], SectionNumbers[40], SectionNumbers[41]);
          println(ComplexPacking_ReferenceForGroupLengths);

          print("ComplexPacking/Length increment for the group lengths:\t");
          ComplexPacking_LengthIncrementForTheGroupLengths = SectionNumbers[42];
          println(ComplexPacking_LengthIncrementForTheGroupLengths);

          print("ComplexPacking/True length of last group:\t");
          ComplexPacking_TrueLengthOfLastGroup = U_NUMx4(SectionNumbers[43], SectionNumbers[44], SectionNumbers[45], SectionNumbers[46]);
          println(ComplexPacking_TrueLengthOfLastGroup);

          print("ComplexPacking/Number of bits used for the scaled group lengths:\t");
          ComplexPacking_NumberOfBitsUsedForTheScaledGroupLengths = SectionNumbers[47];
          println(ComplexPacking_NumberOfBitsUsedForTheScaledGroupLengths);

          if (this.DataRepresentationTemplateNumber === 3) { // Grid point data - complex packing and spatial differencing

            print("ComplexPacking/Order of Spatial Differencing:\t");
            ComplexPacking_OrderOfSpatialDifferencing = SectionNumbers[48];
            println(ComplexPacking_OrderOfSpatialDifferencing);

            print("ComplexPacking/Number of octets required in the Data Section to specify the extra descriptors:\t");
            ComplexPacking_NumberOfExtraOctetsRequiredInDataSection = SectionNumbers[49];
            println(ComplexPacking_NumberOfExtraOctetsRequiredInDataSection);
          }
        }
      }

      //////////////////////////////////////////////////
      if (this.DataAllocated === false) {
        this.DataTitles = [];
        this.DataValues = [];
        for (var i = 0; i < DATA.numMembers; i++) {
          this.DataValues[i] = new Float32Array(this.Nx * this.Ny);
        }

        this.DataAllocated = true;
      }
      //////////////////////////////////////////////////

      SectionNumbers = this.getGrib2Section(6); // Section 6: Bit-Map Section

      if (SectionNumbers.length > 1) {
        print("Bit map indicator:\t");
        Bitmap_Indicator = SectionNumbers[6];
        switch (Bitmap_Indicator) {
          case 0: println("A bit map applies to this product and is specified in this Section."); break;
          case 254: println("A bit map defined previously in the same GRIB message applies to this product."); break;
          case 255: println("A bit map does not apply to this product."); break;
          default: println("A bit map pre-determined by the originating/generating Centre applies to this product and is not specified in this Section."); break;
        }

        if (Bitmap_Indicator === 0) { // A bit map applies to this product and is specified in this Section.

          this.NullBitmapFlags = new Int32Array((SectionNumbers.length - 7) * 8);

          println(">>>>> NullBitmapFlags.length", this.NullBitmapFlags.length);

          for (var i = 0; i < SectionNumbers.length - 7; i++) {
            var /* String */ b = binary(SectionNumbers[7 + i], 8);

            for (var j = 0; j < 8; j++) {
              this.NullBitmapFlags[i * 8 + j] = parseInt(b.substring(j, j + 1));
            }
          }
        }
      }

      if (this.DataRepresentationTemplateNumber === 40) { // Grid point data – JPEG 2000 Code Stream Format

        Bitmap_beginPointer = nPointer + 6;

        SectionNumbers = this.getGrib2Section(7); // Section 7: Data Section

        if (SectionNumbers.length > 100) { // ???????? to handle the case of no bitmap

          Bitmap_endPointer = nPointer;

          var n = Bitmap_beginPointer;

          println(hex(this.fileBytes[n], 2), hex(this.fileBytes[n + 1], 2));  // FF 4F : Marker Start of codestream
          n += 2;

          println(hex(this.fileBytes[n], 2), hex(this.fileBytes[n + 1], 2));  // FF 51 : Marker Image and tile size
          n += 2;

          JPEG2000_Lsiz = U_NUMx2(this.fileBytes[n], this.fileBytes[n + 1]);
          println("Lsiz =", JPEG2000_Lsiz);  // Lsiz : Length of marker segment in bytes (not including the marker)
          n += 2;

          JPEG2000_Rsiz = U_NUMx2(this.fileBytes[n], this.fileBytes[n + 1]);
          println("Rsiz =", JPEG2000_Rsiz);  // Rsiz : Denotes capabilities that a decoder needs to properly decode the codestream
          n += 2;
          print("\t");
          switch (JPEG2000_Rsiz) {
            case 0: println("Capabilities specified in this Recommendation | International Standard only"); break;
            case 1: println("Codestream restricted as described for Profile 0 from Table A.45"); break;
            case 2: println("Codestream restricted as described for Profile 1 from Table A.45"); break;
            default: println("Reserved"); break;
          }

          JPEG2000_Xsiz = U_NUMx4(this.fileBytes[n], this.fileBytes[n + 1], this.fileBytes[n + 2], this.fileBytes[n + 3]);
          println("Xsiz =", JPEG2000_Xsiz);  // Xsiz : Width of the reference grid
          n += 4;

          JPEG2000_Ysiz = U_NUMx4(this.fileBytes[n], this.fileBytes[n + 1], this.fileBytes[n + 2], this.fileBytes[n + 3]);
          println("Ysiz =", JPEG2000_Ysiz);  // Ysiz : Height of the reference grid
          n += 4;

          JPEG2000_XOsiz = U_NUMx4(this.fileBytes[n], this.fileBytes[n + 1], this.fileBytes[n + 2], this.fileBytes[n + 3]);
          println("XOsiz =", JPEG2000_XOsiz);  // XOsiz : Horizontal offset from the origin of the reference grid to the left side of the image area
          n += 4;

          JPEG2000_YOsiz = U_NUMx4(this.fileBytes[n], this.fileBytes[n + 1], this.fileBytes[n + 2], this.fileBytes[n + 3]);
          println("YOsiz =", JPEG2000_YOsiz);  // YOsiz : Vertical offset from the origin of the reference grid to the top side of the image area
          n += 4;

          JPEG2000_XTsiz = U_NUMx4(this.fileBytes[n], this.fileBytes[n + 1], this.fileBytes[n + 2], this.fileBytes[n + 3]);
          println("XTsiz =", JPEG2000_XTsiz);  // XTsiz : Width of one reference tile with respect to the reference grid
          n += 4;

          JPEG2000_YTsiz = U_NUMx4(this.fileBytes[n], this.fileBytes[n + 1], this.fileBytes[n + 2], this.fileBytes[n + 3]);
          println("YTsiz =", JPEG2000_YTsiz);  // YTsiz : Height of one reference tile with respect to the reference grid
          n += 4;

          JPEG2000_XTOsiz = U_NUMx4(this.fileBytes[n], this.fileBytes[n + 1], this.fileBytes[n + 2], this.fileBytes[n + 3]);
          println("XTOsiz =", JPEG2000_XTOsiz);  // XTOsiz : Horizontal offset from the origin of the reference grid to the left side of the first tile
          n += 4;

          JPEG2000_YTOsiz = U_NUMx4(this.fileBytes[n], this.fileBytes[n + 1], this.fileBytes[n + 2], this.fileBytes[n + 3]);
          println("YTOsiz =", JPEG2000_YTOsiz);  // YTOsiz : Vertical offset from the origin of the reference grid to the top side of the first tile
          n += 4;

          JPEG2000_Csiz = U_NUMx2(this.fileBytes[n], this.fileBytes[n + 1]);
          println("Csiz =", JPEG2000_Csiz);  // Csiz : Number of components in the image
          n += 2;

          JPEG2000_Ssiz = this.fileBytes[n];
          println("Ssiz =", JPEG2000_Ssiz);  // Ssiz : Precision (depth) in bits and sign of the ith component samples
          n += 1;

          JPEG2000_XRsiz = this.fileBytes[n];
          println("XRsiz =", JPEG2000_XRsiz);  // XRsiz : Horizontal separation of a sample of ith component with respect to the reference grid. There is one occurrence of this parameter for each component
          n += 1;

          JPEG2000_YRsiz = this.fileBytes[n];
          println("YRsiz =", JPEG2000_YRsiz);  // YRsiz : Vertical separation of a sample of ith component with respect to the reference grid. There is one occurrence of this parameter for each component.
          n += 1;

          if ((this.fileBytes[n] === -1) && (this.fileBytes[n + 1] === 100)) { // the case of optional Comment

            println(hex(this.fileBytes[n], 2), hex(this.fileBytes[n + 1], 2));  // FF 64 : Marker Comment
            n += 2;

            JPEG2000_Lcom = U_NUMx2(this.fileBytes[n], this.fileBytes[n + 1]);
            println("Lcom =", JPEG2000_Lcom);  // Lcom : Length of marker segment in bytes (not including the marker)
            n += 2;

            JPEG2000_Rcom = U_NUMx2(this.fileBytes[n], this.fileBytes[n + 1]);
            println("Rcom =", JPEG2000_Rcom);  // Rcom : Registration value of the marker segment
            n += 2;

            print("Comment: ");
            for (var i = 0; i < JPEG2000_Lcom - 4; i++) {
              cout(this.fileBytes[n]);
              n += 1;
            }
            println();
          }

          println("numXtiles:", (JPEG2000_Xsiz - JPEG2000_XTOsiz) / JPEG2000_XTsiz);
          println("numYtiles:", (JPEG2000_Ysiz - JPEG2000_YTOsiz) / JPEG2000_YTsiz);

          println(hex(this.fileBytes[n], 2), hex(this.fileBytes[n + 1], 2));  // FF 52 : Marker Coding style default
          n += 2;

          JPEG2000_Lcod = U_NUMx2(this.fileBytes[n], this.fileBytes[n + 1]);
          println("Lcod =", JPEG2000_Lcod);  // Lcod : Length of marker segment in bytes (not including the marker)
          n += 2;

          JPEG2000_Scod = this.fileBytes[n];
          println("Scod =", JPEG2000_Scod);  // Scod : Coding style for all components
          n += 1;

          // SGcod : Parameters for coding style designated in Scod. The parameters are independent of components.

          JPEG2000_SGcod_ProgressionOrder = this.fileBytes[n];
          println("JPEG2000_SGcod_ProgressionOrder =", JPEG2000_SGcod_ProgressionOrder); // Progression order
          n += 1;

          JPEG2000_SGcod_NumberOfLayers = U_NUMx2(this.fileBytes[n], this.fileBytes[n + 1]);
          println("JPEG2000_SGcod_NumberOfLayers =", JPEG2000_SGcod_NumberOfLayers); // Number of layers
          n += 2;

          JPEG2000_SGcod_MultipleComponentTransformation = this.fileBytes[n];
          println("JPEG2000_SGcod_MultipleComponentTransformation =", JPEG2000_SGcod_MultipleComponentTransformation); // Multiple component transformation usage
          n += 1;

          // SPcod : Parameters for coding style designated in Scod. The parameters relate to all components.

          JPEG2000_SPcod_NumberOfDecompositionLevels = this.fileBytes[n];
          println("JPEG2000_SPcod_NumberOfDecompositionLevels =", JPEG2000_SPcod_NumberOfDecompositionLevels); // Number of decomposition levels, NL, Zero implies no transformation.
          n += 1;

          JPEG2000_SPcod_CodeBlockWidth = this.fileBytes[n];
          println("JPEG2000_SPcod_CodeBlockWidth =", JPEG2000_SPcod_CodeBlockWidth); // Code-block width
          n += 1;

          JPEG2000_SPcod_CodeBlockHeight = this.fileBytes[n];
          println("JPEG2000_SPcod_CodeBlockHeight =", JPEG2000_SPcod_CodeBlockHeight); // Code-block height
          n += 1;

          JPEG2000_SPcod_CodeBlockStyle = this.fileBytes[n];
          println("JPEG2000_SPcod_CodeBlockStyle =", JPEG2000_SPcod_CodeBlockStyle); // Code-block style
          n += 1;

          JPEG2000_SPcod_Transformation = this.fileBytes[n];
          println("JPEG2000_SPcod_Transformation =", JPEG2000_SPcod_Transformation); // Wavelet transformation used
          n += 1;

          //Ii through In: Precinct sizePrecinct size
          //If Scod or Scoc = xxxx xxx0, this parameter is not presen; otherwise
          //this indicates precinct width and height. The first parameter (8 bits)
          //corresponds to the NLLL sub-band. Each successive parameter
          //corresponds to each successive resolution level in order.

          println(hex(this.fileBytes[n], 2), hex(this.fileBytes[n + 1], 2));  // FF 5C : Marker Quantization default
          n += 2;

          JPEG2000_Lqcd = U_NUMx2(this.fileBytes[n], this.fileBytes[n + 1]);
          println("Lqcd =", JPEG2000_Lqcd);  // Lqcd : Length of marker segment in bytes (not including the marker)
          n += 2;

          JPEG2000_Sqcd = this.fileBytes[n];
          println("Sqcd =", JPEG2000_Sqcd);  // Sqcd : Quantization style for all components
          n += 1;

          //var /* int */ JPEG2000_SPgcd = function(...);
          //println("SPgcd =", JPEG2000_SPcod);  // SPgcd : Quantization step size value for the ith sub-band in the defined order
          n += JPEG2000_Lqcd - 3;

          println(hex(this.fileBytes[n], 2), hex(this.fileBytes[n + 1], 2));  // FF 90 : Marker Start of tile-part
          n += 2;

          JPEG2000_Lsot = U_NUMx2(this.fileBytes[n], this.fileBytes[n + 1]);
          println("Lsot =", JPEG2000_Lsot);  // Lsot : Length of marker segment in bytes (not including the marker)
          n += 2;

          JPEG2000_Isot = U_NUMx2(this.fileBytes[n], this.fileBytes[n + 1]);
          println("Isot =", JPEG2000_Isot);  // Isot : Tile index. This number refers to the tiles in raster order starting at the number 0
          n += 2;

          JPEG2000_Psot = U_NUMx4(this.fileBytes[n], this.fileBytes[n + 1], this.fileBytes[n + 2], this.fileBytes[n + 3]);
          println("Psot =", JPEG2000_Psot);  // Psot : Length, in bytes, from the beginning of the first byte of this SOT marker segment of the tile-part to the end of the data of that tile-part. Figure A.16 shows this alignment. Only the last tile-part in the codestream may contain a 0 for Psot. If the Psot is 0, this tile-part is assumed to contain all data until the EOC marker.
          n += 4;

          JPEG2000_TPsot = this.fileBytes[n];
          println("TPsot =", JPEG2000_TPsot);  // TPsot : Tile-part index. There is a specific order required for decoding tile-parts; this index denotes the order from 0. If there is only one tile-part for a tile, then this value is zero. The tile-parts of this tile shall appear in the codestream in this order, although not necessarily consecutively.
          n += 1;

          JPEG2000_TNsot = this.fileBytes[n];
          println("TNsot =", JPEG2000_TNsot);  // TNsot : Number of tile-parts of a tile in the codestream. Two values are allowed: the correct number of tileparts for that tile and zero. A zero value indicates that the number of tile-parts of this tile is not specified in this tile-part.
          n += 1;
          print("\t");
          switch (JPEG2000_TNsot) {
            case 0: println("Number of tile-parts of this tile in the codestream is not defined in this header"); break;
            default: println("Number of tile-parts of this tile in the codestream"); break;
          }

          println(hex(this.fileBytes[n], 2), hex(this.fileBytes[n + 1], 2));  // FF 93 : Start of data
          n += 2;

          //this.printMore(n, 100); // <<<<<<<<<<<<<<<<<<<<

          /*

          see page 84: Annex D
          Coefficient bit modeling

            see page 174

          L-R-C-P: For each quality layer q = 0, …, LYEpoc - 1
          For each resolution delta r = RSpoc, …, REpoc-1
          For each component, c=CSpoc, …, CEpoc-1
          For each precinct, p
          Packet P(q,r,c,p) appears.
          */
          /*
                    var o = 0;
                    print("CodeStream: ");
                    while (!((this.fileBytes[n] === -1) && (this.fileBytes[n + 1] === -39))) { // note: If the Psot is 0 we need another algorithm to read because in that case the tile-part is assumed to contain all data until the EOC marker.
                      //cout(this.fileBytes[n]);
                      //print(o++);
                      //println("(" + hex(this.fileBytes[n]) + ")");
                      n += 1;
                    }
                    println();
          */
          //printing the end of grib

          this.printMore(n, 2); // <<<<<<<<<<<<<<<<<<<<
          n += 2;

          var /* byte[] */ imageBytes = new Uint8Array(1 + Bitmap_endPointer - Bitmap_beginPointer);
          for (var i = 0; i < imageBytes.length; i++) {
            imageBytes[i] = this.fileBytes[i + Bitmap_beginPointer];
          }
          this.DataTitles[memberID] = DATA.Filename.replace(".grib2", "");
          if (DATA.numMembers > 1) {
            this.DataTitles[memberID] += nf0(memberID, 2);
          }

          Bitmap_FileName = Jpeg2000Folder + this.DataTitles[memberID] + ".jp2";

          //saveBytes(Bitmap_FileName, imageBytes);
          //println("Bitmap section saved at:", Bitmap_FileName);

          var image = jpx_decode(imageBytes);
          this.data = image.pixelData;

          Bitmap_FileLength = 1 + Bitmap_endPointer - Bitmap_beginPointer;
        }
        else {
          this.DataTitles[memberID] = DATA.Filename.replace(".grib2", "");
          if (DATA.numMembers > 1) {
            this.DataTitles[memberID] += nf0(memberID, 2);
          }
          Bitmap_FileName = "";
          Bitmap_FileLength = 0;
        }
      }

      else if ((this.DataRepresentationTemplateNumber === 0) || // Grid point data - simple packing

        (this.DataRepresentationTemplateNumber === 2) || // Grid point data - complex packing
        (this.DataRepresentationTemplateNumber === 3)) { // Grid point data - complex packing and spatial differencing

        Bitmap_beginPointer = nPointer + 6;

        //s = this.getGrib2Section(7); // Section 7: Data Section

        //if (SectionNumbers.length > 1)
        { // ???????? to handle the case of no bitmap

          Bitmap_endPointer = nPointer;

          nPointer = Bitmap_beginPointer;
          var /* int */ b = 0;

          var /* float[] */ data = [];

          if (this.DataRepresentationTemplateNumber === 0) { // Grid point data - simple packing

            data = new Float32Array(this.NumberOfDataPoints);

            for (var i = 0; i < this.NumberOfDataPoints; i++) {
              var /* int[] */ m = new Int32Array(this.NumberOfBitsUsedForEachPackedValue);
              for (var j = 0; j < m.length; j++) {
                m[j] = getNthBit(this.fileBytes[nPointer], b);
                b += 1;
                if (b === 8) {
                  b = 0;
                  nPointer += 1;
                }
              }
              data[i] = U_NUMxI(m);
            }
          }

          if ((this.DataRepresentationTemplateNumber === 2) || // Grid point data - complex packing
            (this.DataRepresentationTemplateNumber === 3)) { // Grid point data - complex packing and spatial differencing

            println();
            println("First value(s) of original (undifferenced) scaled data values, followed by the overall minimum of the differences.");

            var /* int */ FirstValues1 = 0;
            var /* int */ FirstValues2 = 0;
            var /* int */ OverallMinimumOfTheDifferences = 0;

            {
              var /* int[] */ m = new Int32Array(8 * ComplexPacking_NumberOfExtraOctetsRequiredInDataSection);
              for (var j = 0; j < m.length; j++) {
                m[j] = getNthBit(this.fileBytes[nPointer], b);

                b += 1;
                if (b === 8) {
                  b = 0;
                  nPointer += 1;
                }
              }
              FirstValues1 = S_NUMxI(m);
              println("FirstValues1 =", FirstValues1);
            }

            if (ComplexPacking_OrderOfSpatialDifferencing === 2) { //second order spatial differencing

              var /* int[] */ m = new Int32Array(8 * ComplexPacking_NumberOfExtraOctetsRequiredInDataSection);
              for (var j = 0; j < m.length; j++) {
                m[j] = getNthBit(this.fileBytes[nPointer], b);
                b += 1;
                if (b === 8) {
                  b = 0;
                  nPointer += 1;
                }
              }
              FirstValues2 = S_NUMxI(m);
              println("FirstValues2 =", FirstValues2);
            }

            {
              var /* int[] */ m = new Int32Array(8 * ComplexPacking_NumberOfExtraOctetsRequiredInDataSection);
              for (var j = 0; j < m.length; j++) {
                m[j] = getNthBit(this.fileBytes[nPointer], b);
                b += 1;
                if (b === 8) {
                  b = 0;
                  nPointer += 1;
                }
              }

              OverallMinimumOfTheDifferences = S_NUMxI(m);
              println("OverallMinimumOfTheDifferences =", OverallMinimumOfTheDifferences);
            }

            // read the group reference values
            var /* int[] */ group_refs = new Int32Array(ComplexPacking_NumberOfGroupsOfDataValues);

            for (var i = 0; i < ComplexPacking_NumberOfGroupsOfDataValues; i++) {
              var /* int[] */ m = new Int32Array(this.NumberOfBitsUsedForEachPackedValue);
              for (var j = 0; j < m.length; j++) {
                m[j] = getNthBit(this.fileBytes[nPointer], b);
                b += 1;
                if (b === 8) {
                  b = 0;
                  nPointer += 1;
                }
              }
              group_refs[i] = U_NUMxI(m);
            }
            //println(group_refs);

            //Bits set to zero shall be appended where necessary to ensure this sequence of numbers ends on an octet boundary.
            if (b != 0) {
              b = 0;
              nPointer += 1;
            }

            // read the group widths
            var /* int[] */ group_widths = new Int32Array(ComplexPacking_NumberOfGroupsOfDataValues);

            for (var i = 0; i < ComplexPacking_NumberOfGroupsOfDataValues; i++) {
              var /* int[] */ m = new Int32Array(ComplexPacking_NumberOfBitsUsedForGroupWidths);
              for (var j = 0; j < m.length; j++) {
                m[j] = getNthBit(this.fileBytes[nPointer], b);
                b += 1;
                if (b === 8) {
                  b = 0;
                  nPointer += 1;
                }
              }
              group_widths[i] = U_NUMxI(m);

              group_widths[i] += ComplexPacking_ReferenceForGroupWidths;
            }
            //println(group_widths);

            //Bits set to zero shall be appended where necessary to ensure this sequence of numbers ends on an octet boundary.
            if (b != 0) {
              b = 0;
              nPointer += 1;
            }

            // read the group lengths
            var /* int[] */ group_lengths = new Int32Array(ComplexPacking_NumberOfGroupsOfDataValues);

            if (ComplexPacking_GroupSplittingMethodUsed === 1) {
              for (var i = 0; i < ComplexPacking_NumberOfGroupsOfDataValues; i++) {
                var /* int[] */ m = new Int32Array(ComplexPacking_NumberOfBitsUsedForTheScaledGroupLengths);
                for (var j = 0; j < m.length; j++) {
                  m[j] = getNthBit(this.fileBytes[nPointer], b);
                  b += 1;
                  if (b === 8) {
                    b = 0;
                    nPointer += 1;
                  }
                }
                group_lengths[i] = U_NUMxI(m);

                group_lengths[i] = group_lengths[i] * ComplexPacking_LengthIncrementForTheGroupLengths + ComplexPacking_ReferenceForGroupLengths;
              }
              group_lengths[ComplexPacking_NumberOfGroupsOfDataValues - 1] = ComplexPacking_TrueLengthOfLastGroup;
            }
            else {
              println("Error: It does not support this splitting method:", ComplexPacking_GroupSplittingMethodUsed);
            }
            //println(group_lengths);

            //Bits set to zero shall be appended where necessary to ensure this sequence of numbers ends on an octet boundary.
            if (b != 0) {
              b = 0;
              nPointer += 1;
            }

            // check
            var /* int */ total = 0;
            for (var i = 0; i < ComplexPacking_NumberOfGroupsOfDataValues; i++) {
              total += group_lengths[i];
            }
            if (total != this.NumberOfDataPoints) {
              //if (total != this.Np) {
              println("Error: Size mismatch!");
            }

            data = new Float32Array(total);

            var /* int */ count = 0;

            for (var i = 0; i < ComplexPacking_NumberOfGroupsOfDataValues; i++) {
              if (group_widths[i] != 0) {
                for (var j = 0; j < group_lengths[i]; j++) {
                  var /* int[] */ m = new Int32Array(group_widths[i]);
                  for (var k = 0; k < m.length; k++) {
                    m[k] = getNthBit(this.fileBytes[nPointer], b);
                    b += 1;
                    if (b === 8) {
                      b = 0;
                      nPointer += 1;
                    }
                  }

                  data[count] = U_NUMxI(m) + group_refs[i];

                  count += 1;
                }
              }
              else {
                for (var j = 0; j < group_lengths[i]; j++) {
                  data[count] = group_refs[i];

                  count += 1;
                }
              }
            }

            // not sure if this algorithm works fine for complex packing WITHOUT spatial differencing ?????
            if (this.DataRepresentationTemplateNumber === 3) { // Grid point data - complex packing and spatial differencing

              // spatial differencing
              if (ComplexPacking_OrderOfSpatialDifferencing === 1) { // case of first order
                data[0] = FirstValues1;
                for (var i = 1; i < total; i++) {
                  data[i] += OverallMinimumOfTheDifferences;
                  data[i] = data[i] + data[i - 1];
                }
              }
              else if (ComplexPacking_OrderOfSpatialDifferencing === 2) { // case of second order
                data[0] = FirstValues1;
                data[1] = FirstValues2;
                for (var i = 2; i < total; i++) {
                  data[i] += OverallMinimumOfTheDifferences;
                  data[i] = data[i] + (2 * data[i - 1]) - data[i - 2];
                }
              }
            }
          }

          // Mode  0 +x, -y, adjacent x, adjacent rows same dir
          // Mode  64 +x, +y, adjacent x, adjacent rows same dir
          if ((this.ScanningMode === 0) || (this.ScanningMode === 64)) {
            // Mode  128 -x, -y, adjacent x, adjacent rows same dir
            // Mode  192 -x, +y, adjacent x, adjacent rows same dir
            // change -x to +x ie east to west -> west to east
          } else if ((this.ScanningMode === 128) || (this.ScanningMode === 192)) {
            var /* float */ tmp;
            var /* int */ mid = int(this.Nx / 2);
            //println( "this.Nx =" +this.Nx +" mid ="+ mid );
            for (var index = 0; index < data.length; index += this.Nx) {
              for (var idx = 0; idx < mid; idx++) {
                tmp = data[index + idx];
                data[index + idx] = data[index + this.Nx - idx - 1];
                data[index + this.Nx - idx - 1] = tmp;
                //println( "switch " + (index + idx) + " " +
                //(index + this.Nx -idx -1) );
              }
            }
          }
          else {
            // scanMode === 16, 80, 144, 208 adjacent rows scan opposite dir
            var /* float */ tmp;
            var /* int */ mid = int(this.Nx / 2);
            //println( "this.Nx =" +this.Nx +" mid ="+ mid );
            for (var index = 0; index < data.length; index += this.Nx) {
              var /* int */ row = int(index / this.Nx);
              if (row % 2 === 1) {  // odd numbered row, calculate reverse index
                for (var idx = 0; idx < mid; idx++) {
                  tmp = data[index + idx];
                  data[index + idx] = data[index + this.Nx - idx - 1];
                  data[index + this.Nx - idx - 1] = tmp;
                  //println( "switch " + (index + idx) + " " +
                  //(index + this.Nx -idx -1) );
                }
              }
            }
          }

          //Bits set to zero shall be appended where necessary to ensure this sequence of numbers ends on an octet boundary.
          if (b != 0) {
            b = 0;
            nPointer += 1;
          }

          nPointer -= 1; // <<<<????

          println("nPointer", nPointer);
          println("this.fileBytes.length", this.fileBytes.length);

          println("data.length", data.length);
          println("Nx X Ny", this.Nx, this.Ny, this.Nx * this.Ny);

          var /* float */ BB = Math.pow(2, this.BinaryScaleFactor);
          var /* float */ DD = Math.pow(10, this.DecimalScaleFactor);
          var /* float */ RR = this.ReferenceValue;

          if (Bitmap_Indicator === 0) { // A bit map applies to this product

            var /* int */ i = -1;
            for (var q = 0; q < this.Nx * this.Ny; q++) {
              if (this.NullBitmapFlags[q] === 0) {
                this.DataValues[memberID][q] = undefined;
              }
              else {
                i += 1;

                this.DataValues[memberID][q] = ((data[i] * BB) + RR) / DD;
              }
            }
          }
          else {
            for (var q = 0; q < this.Nx * this.Ny; q++) {
              var /* int */ i = q;

              this.DataValues[memberID][q] = ((data[i] * BB) + RR) / DD;
            }
          }

          //for (var q = 0; q < 20; q++) println(this.DataValues[memberID][q]);

          this.DataTitles[memberID] = DATA.Filename.replace(".grib2", "");
          if (DATA.numMembers > 1) {
            this.DataTitles[memberID] += nf0(memberID, 2);
          }
          Bitmap_FileName = Jpeg2000Folder + this.DataTitles[memberID] + ".jp2"; // not a jp2 file!
          Bitmap_FileLength = 1 + Bitmap_endPointer - Bitmap_beginPointer;

        }
        /*
        else {
          this.DataTitles[memberID] = DATA.Filename.replace(".grib2", "");
          if (DATA.numMembers > 1) {
            this.DataTitles[memberID] += nf0(memberID, 2);
          }
          Bitmap_FileName = "";
          Bitmap_FileLength = 0;
        }
        */

      }

      SectionNumbers = this.getGrib2Section(8); // Section 8: 7777

      if (this.DataRepresentationTemplateNumber === 40) { // Grid point data – JPEG 2000 Code Stream Format
        var /* float */ BB = Math.pow(2, this.BinaryScaleFactor);
        var /* float */ DD = Math.pow(10, this.DecimalScaleFactor);
        var /* float */ RR = this.ReferenceValue;

        if (Bitmap_Indicator === 0) { // A bit map applies to this product

          var /* int */ i = -1;
          for (var q = 0; q < this.Nx * this.Ny; q++) {
            if (this.NullBitmapFlags[q] === 0) {
              this.DataValues[memberID][q] = undefined;
            }
            else {
              i += 1;

              this.DataValues[memberID][q] = ((this.data[i] * BB) + RR) / DD;
            }
          }
        }
        else {
          for (var q = 0; q < this.Nx * this.Ny; q++) {
            var /* int */ i = q;

            this.DataValues[memberID][q] = ((this.data[i] * BB) + RR) / DD;
          }
        }
      }
    }
  };

  this. /* void */ parse = function (bytes) {
    this.fileBytes = bytes;

    this.readGrib2Members(DATA.numMembers);
  };
};
