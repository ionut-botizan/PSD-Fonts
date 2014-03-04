/**
 * INSTALL:
 * Copy this file to the Photoshop scripts folder and restart Photoshop
 * Ex. "%ProgramFiles%\Adobe\Adobe Photoshop CS6 (64 Bit)\Presets\Scripts"
 *     for the 64 bit Windows version
 * 
 * USAGE:
 * Installing the script in the "Scripts" folder will add a "List Fonts" entry to Photoshop's "File > Scripts" menu.
 * You can use it by clicking on the new menu entry or by setting a keyboard shortcut from "Edit > Keyboard Shortcuts..."
 */

// BEGIN__HARVEST_EXCEPTION_ZSTRING

<javascriptresource>
<name>$$$/JavaScripts/ListFonts/Menu=List Fonts</name>
<category>fonts</category>
<enableinfo>true</enableinfo>
</javascriptresource>

// END__HARVEST_EXCEPTION_ZSTRING


#target photoshop

var FontsFound = [];

var MainScreen = {};
var wTitle = 'Find used fonts';

var startTime = Date.now();
var keepSearching = true;
var searching, searchText;

for (var i = 0; i < $.screens.length; i++) {
	if ($.screens[i].primary) {
		MainScreen = {
			top    : $.screens[i].top,
			left   : $.screens[i].left,
			width  : $.screens[i].right - $.screens[i].left,
			height : $.screens[i].bottom - $.screens[i].top,
		};
		break;
	}
}

MainScreen.center = function(w, h) {
	var x, y, x_, y_;
	
	x = Math.floor(MainScreen.width / 2) - Math.floor(w / 2);
	y = Math.floor(MainScreen.height / 2) - Math.floor(h / 2);
	x_ = x + w;
	y_ = y + h;
	
	return [x, y, x_, y_];
}

function _longOp() {
	searching = new Window('palette', wTitle, MainScreen.center(400, 30), {closeButton: true});
	searching.add('statictext', [10, 10, 390, 30], 'Searching...');
	searching.show();

	searching.onClose = function() {
		keepSearching = false;
	}
}

try {
	for (var i = 0, layersNum = countLayers(); i <= layersNum; i++) {
		// if it takes more than 1 second, show "Searching..." window
		// PS scripting doesn't have `setTimeout()` & `clearTimeout()`
		(Date.now() > startTime + 1000) && !searching && _longOp();
		
		if (!keepSearching) {
			throw 'canceled';
		}
		
		try {
			findFonts(i);
		} catch(e) {
			// most probably failed because there's no "Background" layer
		}
		
	}
	
	if (searching) {
		searching.close();
		app.beep();
	}
	
	if (!FontsFound.length) {
		var result = new Window('dialog', wTitle, MainScreen.center(400, 30));
		result.add('statictext', [10,10,390,30], 'No fonts were found in this document.');
		result.show();
	} else {
		var result = new Window('dialog', wTitle, MainScreen.center(400, 200));
		result.add('statictext', [10,10,390,30], 'Found fonts:');
		result.add('edittext', [10,30,390,190], FontsFound.sort().join('\n'));
		result.show();
	}
} catch(e) {
	$.writeln(e);
}



function indexOf(a, i) {
	if (a.indexOf) {
		return a.indexOf(i);
	}

	for (var k = 0, len = a.length; k < len; k++) {
		if (a[k] === i) {
			return k;            
		}
	}

	return -1;
}

function countLayers() {
	var ref = new ActionReference();
	
	ref.putProperty(charIDToTypeID('Prpr'), charIDToTypeID('NmbL'));
	ref.putEnumerated(charIDToTypeID('Dcmn'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
	
	return executeActionGet(ref).getInteger(charIDToTypeID('NmbL'));
}

function findFonts(layerIdx) {
	var ref = new ActionReference(),
	desc, list, ranges, range, style, font;
	
	ref.putIndex(charIDToTypeID('Lyr '), layerIdx);
	desc = executeActionGet(ref);
	
	if (desc.hasKey(charIDToTypeID('Txt '))) {
		list   = desc.getObjectValue(charIDToTypeID('Txt '));
		ranges = list.getList(charIDToTypeID('Txtt'));
		
		for (var i = 0; i < ranges.count; i++) {
			range = ranges.getObjectValue(i);
			style = range.getObjectValue(charIDToTypeID('TxtS'));
			font  = style.getString(charIDToTypeID('FntN')) + ' - ' + style.getString(charIDToTypeID('FntS'));
			
			indexOf(FontsFound, font) == -1 && FontsFound.push(font);
		}
	}
}