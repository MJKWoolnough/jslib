/**
 * The casefold module provides a simple Unicode case-folding function.
 *
 * @module casefold
 */
/** */

const cf = new Map<string, string>(),
      add = (from: number, ...to: number[]) => cf.set(String.fromCharCode(from), String.fromCharCode(...to)),
      addRange = (start: number, end: number, shift = 32) => {
	for (let i = start; i <= end; i++) {
		add(i, i + shift);
	}
      },
      addRange953 = (start: number, end: number, shift: number) => {
	for (let i = start; i <= end; i++) {
		add(i, i + shift, 953);
	}
      },
      altAdd = (start: number, end: number, shift = 1) => {
	for (let i = start; i <= end; i += 2) {
		add(i, i + shift);
	}
      };

addRange(65, 90);
add(181, 956);
addRange(192, 214);
addRange(216, 222);
add(223, 115, 115);
altAdd(256, 302);
add(304, 105, 775);
altAdd(306, 310);
altAdd(313, 327);
add(329, 700, 110);
altAdd(330, 374);
add(376, 255);
altAdd(377, 381);
add(383, 115);
add(385, 595);
altAdd(386, 388);
add(390, 596);
add(391, 392);
addRange(393, 394, 205);
add(395, 396);
add(398, 477);
add(399, 601);
add(400, 603);
add(401, 402);
add(403, 608);
add(404, 611);
add(406, 617);
add(407, 616);
add(408, 409);
add(412, 623);
add(413, 626);
add(415, 629);
altAdd(416, 420);
add(422, 640);
add(423, 424);
add(425, 643);
add(428, 429);
add(430, 648);
add(431, 432);
addRange(433, 434, 217);
altAdd(435, 437);
add(439, 658);
add(440, 441);
add(444, 445);
add(452, 454);
add(453, 454);
add(455, 457);
add(456, 457);
add(458, 460);
altAdd(459, 475);
altAdd(478, 494);
add(496, 106, 780);
add(497, 499);
altAdd(498, 500);
add(502, 405);
add(503, 447);
altAdd(504, 542);
add(544, 414);
altAdd(546, 562);
add(570, 11365);
add(571, 572);
add(573, 410);
add(574, 11366);
add(577, 578);
add(579, 384);
add(580, 649);
add(581, 652);
altAdd(582, 590);
add(837, 953);
altAdd(880, 882);
add(886, 887);
add(895, 1011);
add(902, 940);
addRange(904, 906, 37);
add(908, 972);
addRange(910, 911, 63);
add(912, 953, 776, 769);
addRange(913, 929);
addRange(931, 939);
add(944, 965, 776, 769);
add(962, 963);
add(975, 983);
add(976, 946);
add(977, 952);
add(981, 966);
add(982, 960);
altAdd(984, 1006);
add(1008, 954);
add(1009, 961);
add(1012, 952);
add(1013, 949);
add(1015, 1016);
add(1017, 1010);
add(1018, 1019);
addRange(1021, 1023, -130);
addRange(1024, 1039, 80);
addRange(1040, 1071);
altAdd(1120, 1152);
altAdd(1162, 1214);
add(1216, 1231);
altAdd(1217, 1229);
altAdd(1232, 1326);
addRange(1329, 1366, 48);
add(1415, 1381, 1410);
addRange(4256, 4293, 7264);
add(4295, 11559);
add(4301, 11565);
addRange(5112, 5117, -8);
add(7296, 1074);
add(7297, 1076);
add(7298, 1086);
addRange(7299, 7300, -6210);
add(7301, 1090);
add(7302, 1098);
add(7303, 1123);
add(7304, 42571);
addRange(7312, 7354, -3008);
addRange(7357, 7359, -3008);
altAdd(7680, 7828);
add(7830, 104, 817);
add(7831, 116, 776);
add(7832, 119, 778);
add(7833, 121, 778);
add(7834, 97, 702);
add(7835, 7777);
add(7838, 115, 115);
altAdd(7840, 7934);
addRange(7944, 7951, -8);
addRange(7960, 7965, -8);
addRange(7976, 7983, -8);
addRange(7992, 7999, -8);
addRange(8008, 8013, -8);
add(8016, 965, 787);
add(8018, 965, 787, 768);
add(8020, 965, 787, 769);
add(8022, 965, 787, 834);
altAdd(8025, 8031, -8);
addRange(8040, 8047, -8);
addRange953(8064, 8071, -7111);
addRange953(8072, 8079, -7119);
addRange953(8080, 8087, -7127);
addRange953(8088, 8095, -7135);
addRange953(8096, 8103, -7143);
addRange953(8104, 8111, -7151);
add(8114, 8048, 953);
add(8115, 945, 953);
add(8116, 940, 953);
add(8118, 945, 834);
add(8119, 945, 834, 953);
addRange(8120, 8121, -8);
addRange(8122, 8123, -74);
add(8124, 945, 953);
add(8126, 953);
add(8130, 8052, 953);
add(8131, 951, 953);
add(8132, 942, 953);
add(8134, 951, 834);
add(8135, 951, 834, 953);
addRange(8136, 8139, -86);
add(8140, 951, 953);
add(8146, 953, 776, 768);
add(8147, 953, 776, 769);
add(8150, 953, 834);
add(8151, 953, 776, 834);
addRange(8152, 8153, -8);
addRange(8154, 8155, -100);
add(8162, 965, 776, 768);
add(8163, 965, 776, 769);
add(8164, 961, 787);
add(8166, 965, 834);
add(8167, 965, 776, 834);
addRange(8168, 8169, -8);
addRange(8170, 8171, -112);
add(8172, 8165);
add(8178, 8060, 953);
add(8179, 969, 953);
add(8180, 974, 953);
add(8182, 969, 834);
add(8183, 969, 834, 953);
addRange(8184, 8185, -128);
addRange(8186, 8187, -126);
add(8188, 969, 953);
add(8486, 969);
add(8490, 107);
add(8491, 229);
add(8498, 8526);
addRange(8544, 8559, 16);
add(8579, 8580);
addRange(9398, 9423, 26);
addRange(11264, 11311, 48);
add(11360, 11361);
add(11362, 619);
add(11363, 7549);
add(11364, 637);
altAdd(11367, 11371);
add(11373, 593);
add(11374, 625);
add(11375, 592);
add(11376, 594);
add(11378, 11379);
add(11381, 11382);
addRange(11390, 11391, -10815);
altAdd(11392, 11490);
altAdd(11499, 11501);
add(11506, 11507);
altAdd(42560, 42604);
altAdd(42624, 42650);
altAdd(42786, 42798);
altAdd(42802, 42862);
altAdd(42873, 42875);
add(42877, 7545);
altAdd(42878, 42886);
add(42891, 42892);
add(42893, 613);
altAdd(42896, 42898);
altAdd(42902, 42920);
add(42922, 614);
add(42923, 604);
add(42924, 609);
add(42925, 620);
add(42926, 618);
add(42928, 670);
add(42929, 647);
add(42930, 669);
add(42931, 43859);
altAdd(42932, 42946);
add(42948, 42900);
add(42949, 642);
add(42950, 7566);
altAdd(42951, 42953);
add(42960, 42961);
altAdd(42966, 42968);
add(42997, 42998);
addRange(43888, 43967, -38864);
add(64256, 102, 102);
add(64257, 102, 105);
add(64258, 102, 108);
add(64259, 102, 102, 105);
add(64260, 102, 102, 108);
add(64261, 115, 116);
add(64262, 115, 116);
add(64275, 1396, 1398);
add(64276, 1396, 1381);
add(64277, 1396, 1387);
add(64278, 1406, 1398);
add(64279, 1396, 1389);
addRange(65313, 65338);
addRange(66560, 66599, 40);
addRange(66736, 66771, 40);
addRange(66928, 66938, 39);
addRange(66940, 66954, 39);
addRange(66956, 66962, 39);
addRange(66964, 66965, 39);
addRange(68736, 68786, 64);
addRange(71840, 71871);
addRange(93760, 93791);
addRange(125184, 125217, 34);

/**
 * The default export folds the case on the given string according to the following table of mappings:
 *
 * https://www.unicode.org/Public/UCD/latest/ucd/CaseFolding.txt
 *
 * @param {string} str The string to be folded.
 *
 * @return {string} The folded string.
 */
export default (str: string): string => {
	let ret = "";

	for (const c of str) {
		ret += cf.get(c) ?? c;
	}

	return ret;
}
