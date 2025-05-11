// Não funciona corretamente no mundo com arcos e sem paladinos
// statistics("Slice");

if (!$("#slicePlanned").length) {
	var configuration = configurationWorld();

	var data = {
		gameSpeed: Number($(configuration).find("config speed").text()),
		unitSpeed: Number($(configuration).find("config unit_speed").text()),
		archers: Number($(configuration).find("game archer").text()),
		knight: Number($(configuration).find("game knight").text()),
		linkDoUnits: "/game.php?&village=" + game_data.village.id + "&type=own_home&mode=units&group=0&page=-1&screen=overview_villages",
		linkDoOverviewVillage: "/game.php?",
		linkDoOrder: "/game.php?",
		speed: [18, 22, 18, 18, 9, 10, 10, 11, 30, 30, 10, 35],
		namesTroops: ["Lança", "Espada", "Machado", "Arqueiro", "Espião", "Cavalaria Leve", "Arqueiro a Cavalo", "Cavalaria Pesada", "Aríete", "Catapulta", "Paladino", "Nobre"]
	};

	var loading = true;
	var downloadedGroup = false;
	var sortDescending = true;
	var img_wojsk = image_base + "unit/";
	var minimumNumberTroops = [];
	var departureTime = [];
	//var omijane=[];  //Not used
	var id = [];
	var troops = [];
	var mojeWioski = [];
	var nazwyWiosek = [];
	var pokazWies = [];
	var tabelkaBB = [];
	var pictures = "spear,sword,axe,archer,spy,light,marcher,heavy,ram,catapult,knight,snob".split(",");
	var ActiveTroops = ("111" + (data.archers ? "1011111" : "01111") + (data.knight ? "10" : "0")).split("");
	if (!data.archers) {
		data.speed.splice(pictures.indexOf("archer"), 1);
		data.speed.splice(pictures.indexOf("marcher") - 1, 1);
		data.namesTroops.splice(pictures.indexOf("archer"), 1);
		data.namesTroops.splice(pictures.indexOf("marcher") - 1, 1);
		pictures.splice(pictures.indexOf("archer"), 1);
		pictures.splice(pictures.indexOf("marcher"), 1);
	}
	if (!data.knight) {
		data.speed.splice(pictures.indexOf("knight"), 1);
		data.namesTroops.splice(pictures.indexOf("knight"), 1);
		pictures.splice(pictures.indexOf("knight"), 1);
	}
	ciacho = getCookie("atkjed");
	if (ciacho != "") {
		ActiveTroops = parseInt(ciacho, 36).toString(2).split("");
		while (ActiveTroops.length < data.speed.length)
			ActiveTroops.splice(0, 0, "0");
	}
	var t = $('#serverTime').html().match(/\d+/g);
	var d = $('#serverDate').html().match(/\d+/g);
	var currentTime = new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2]);
	if (game_data.player.sitter != 0) {
		data.linkDoUnits = "/game.php?t=" + game_data.player.id + "&village=" + game_data.village.id + "&type=own_home&mode=units&group=0&page=-1&screen=overview_villages";
		data.linkDoOverviewVillage += "t=" + game_data.player.id + "&village=" + game_data.village.id + "&screen=info_village&id=";
		data.linkDoOrder += "t=" + game_data.player.id + "&village=";
	} else {
		data.linkDoOverviewVillage += "village=" + game_data.village.id + "&screen=info_village&id=";
		data.linkDoOrder += "village=";
	}
	var allUnits = data.linkDoUnits;
	var predkosc_swiata = Number((data.gameSpeed * data.unitSpeed).toFixed(5));
	for (i = 0; i < data.speed.length; i++) {
		minimumNumberTroops[i] = 0;
		data.speed[i] /= predkosc_swiata;
	}
	rysujPlaner();
	downloadData();
} else
	$("#slicePlanned").remove();
void 0;

function wypiszMozliwosci() {
	if (loading) {
		$("#ladowanie").html("Aguarde, baixando...");
		setTimeout(wypiszMozliwosci, 500);
		return;
	}
	if ($("#wyborWojsk").is(":visible")) {
		zmienStrzalke();
		$("#wyborWojsk").hide();
		$("#lista_wojska").show();
		zapiszWybrane();
	}
	if ($("#sigil").val() != 0)
	{
		// for(i = 0; i < data.speed.length; i++)
		// {
			// data.speed[i] = data.speed[i] * (1 - $("#sigil").val() / 100);
		// }
	}
	var html = [];
	var htmlTmp = [];

	var najwJednostka = -1;
	var cel = document.getElementById('targetCoordinates').value.match(/\d+/g);
	var timeForTroops = document.getElementById('time_for_troops').value.match(/\d+/g);
	var dataForTroops = document.getElementById('data_for_troops').value.match(/\d+/g);

	$('#lista_wojska th').each(function (i) {
		if (i > data.speed.length)
			return;
		if (i && $(this).hasClass("faded"))
			ActiveTroops[i - 1] = "0";
		else if (i)
			ActiveTroops[i - 1] = "1";
	});
	setCookie("atkjed", (parseInt(ActiveTroops.join(""), 2).toString(36)), 360);
	var t = $('#serverTime').html().match(/\d+/g);
	var d = $('#serverDate').html().match(/\d+/g);
	var currentTime = new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2]);
	var czasWejscia = new Date(dataForTroops[2], dataForTroops[1] - 1, dataForTroops[0], timeForTroops[0], timeForTroops[1], timeForTroops[2]);
	var roznicaSekund = (czasWejscia - currentTime) / 1000;

	var ilosc_wiosek = 0;
	for (i = 0; i < mojeWioski.length; i++) {
		if (!pokazWies[i])
			continue;
		htmlTmp[i] = "<tr><td><a href=" + data.linkDoOverviewVillage + id[i] + ">" + nazwyWiosek[i].replace(/\s+/g, "\u00A0");
		 + "</a>";
		najwolniejsza = 0;
		mozliwewojska = "&from=simulator";

		for (j = 0; j < data.speed.length; j++) {
			if (ActiveTroops[j] == "0" || troops[i][j] < 1) {

				htmlTmp[i] += "<td class='hidden'>" + troops[i][j];
				//mozliwewojska += "&att_"+pictures[j]+"="+0;
				continue;
			}
			a = Math.abs(Number(cel[0]) - mojeWioski[i][mojeWioski[i].length - 3]);
			b = Math.abs(Number(cel[1]) - mojeWioski[i][mojeWioski[i].length - 2]);
			czasPrzejscia = Math.sqrt((a * a) + (b * b)) * data.speed[j] / (1 + $("#sigil").val() / 100) * 60;

			if (czasPrzejscia <= roznicaSekund) {
				if (czasPrzejscia > najwolniejsza) {
					najwolniejsza = czasPrzejscia;
					najwJednostka = j;
				}
				mozliwewojska += "&att_" + pictures[j] + "=" + troops[i][j];
				htmlTmp[i] += "<td style='background-color: #C3FFA5;'>" + troops[i][j];
			} else {
				//mozliwewojska += "&att_"+pictures[j]+"="+0;
				htmlTmp[i] += "<td>" + troops[i][j];
			}
		}
		if (najwolniejsza != 0) {
			tmp = new Date(czasWejscia);
			tmp.setSeconds(tmp.getSeconds() - najwolniejsza);
			departureTime[ilosc_wiosek] = new Date(tmp);
			ddd = tmp.getDate() + "." + (tmp.getMonth() + 1) + "\u00A0" + tmp.getHours() + ":" + tmp.getMinutes() + ":" + tmp.getSeconds();
			html[ilosc_wiosek] = htmlTmp[i] + "<td>" + ddd + "<td>" + 0 + "<td><a target='_blank' href='" + data.linkDoOrder + id[i] + "&screen=place&x=" + cel[0] + "&y=" + cel[1] + mozliwewojska + "'>Enviar Tropas</a>";
			tabelkaBB[ilosc_wiosek] = "[*]" + data.namesTroops[najwJednostka] + "[|] " + mojeWioski[i][mojeWioski[i].length - 3] + "|" + mojeWioski[i][mojeWioski[i].length - 2] + " [|] " + cel[0] + "|" + cel[1] + " [|] " + ddd + " [|] [url=https://" + document.URL.split("/")[2] + data.linkDoOrder + id[i] + "&screen=place&x=" + cel[0] + "&y=" + cel[1] + mozliwewojska + "]Continuar\n";
			ilosc_wiosek++;
		} else {
			htmlTmp[i] = "";
		}
	}
	if (ilosc_wiosek == 0)
		UI.InfoMessage('Não é possível calcular para os parâmetros fornecidos.', 1500, 'error');
	$("#ilosc_mozliwosci").html("<b>" + ilosc_wiosek + "/" + mojeWioski.length + "</b>");

	for (i = 0; i < html.length - 1; i++) {
		min = i;
		for (j = i + 1; j < html.length; j++)
			if (departureTime[min] > departureTime[j])
				min = j;

		tmp = html[min];
		html[min] = html[i];
		html[i] = tmp;
		tmp = departureTime[min];
		departureTime[min] = departureTime[i];
		departureTime[i] = tmp;
		tmp = tabelkaBB[min];
		tabelkaBB[min] = tabelkaBB[i];
		tabelkaBB[i] = tmp;
	}
	tabelkaBB.splice(ilosc_wiosek, tabelkaBB.length - ilosc_wiosek);
	$('#lista_wojska tbody').html(html.join("\n") + (ilosc_wiosek ? "<tr><td id='export_bb' colspan=" + (data.speed.length + 4) + "><a href='#' onclick=\"$('#export_bb').html('<textarea cols=100 rows=2 onclick=\\'this.select()\\'>[table][**]Tipo[||]Origem[||]Destino[||]Hora de Saída[||]Ordem[/**]\\n'+tabelkaBB.join('')+'[/table]</textarea>');\" ><img src='" + image_base + "igm/export.png' > Exportar para Código BB</a>" : ''));
	$('#lista_wojska tbody tr').each(function (i) {
		$(this).addClass(i % 2 ? "row_a" : "row_b");
	});
	$("#ladowanie").html("");
	odliczaj();
}

function odliczaj() {
	var t = $('#serverTime').html().match(/\d+/g);
	var d = $('#serverDate').html().match(/\d+/g);
	var currentTime = new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2]);

	$('#lista_wojska tbody>tr').each(function (i) {
		roznicaSekund = (departureTime[i] - currentTime) / 1000;
		if (roznicaSekund > 60)
			$(this).find("td").eq(data.speed.length + 2).html(formatujCzas(roznicaSekund));
		else
			$(this).find("td").eq(data.speed.length + 2).html("<font color='red'>" + roznicaSekund + "</font>");
	});

	setTimeout(odliczaj, 1000);
}
function formatujCzas(s) {
	var h = Math.floor(s / 3600);
	s = s - h * 3600;
	var m = Math.floor(s / 60);
	s = s - m * 60;
	return (h) + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
}
function zmienGrupe() {
	$("#ladowanie").html("<img src='" + image_base + "throbber.gif' />");
	troops = [];
	id = [];
	mojeWioski = [];
	nazwyWiosek = [];
	data.linkDoUnits = document.getElementById('listGrup').value;
	downloadData();
}
function zaznaczWszystko(source) {
	checkboxes = document.getElementsByName('wybierz');
	for (var i = 0, n = checkboxes.length; i < n; i++) {
		checkboxes[i].checked = source.checked;
	}
}
function ustaw_min(n) {
	el = document.getElementById("wyborWojsk");
	el = el.getElementsByTagName("input");
	for (i = 0; i < data.speed.length; i++) {
		el[i].value = n;
		minimumNumberTroops[i] = n;
	}
}
function chowaj_wojska(ktory, ile) {
	ile = Number(ile);
	minimumNumberTroops[ktory] = ile;
	$("#wyborWojsk tr:has(td)").each(function (i) {
		tt = 0;
		if ($(this).find("td").eq(ktory + 1).text() < ile) {
			$(this).hide();
			$(this).find("input").prop('checked', false);
		} else
			for (j = 0; j < minimumNumberTroops.length; j++)
				if ($(this).find("td").eq(j + 1).text() >= minimumNumberTroops[j])
					tt++;
		if (tt == data.speed.length) {
			$(this).show();
			$(this).find("input").prop('checked', true);
		} else {
			$(this).hide();
			$(this).find("input").prop('checked', false);
		}
	});
}
function sortowanie_przegladu(ktory) {
	ktory++;
	var zaznaczone = [];
	var table = document.getElementById("wyborWojsk");
	if (x = table.rows[1].cells[ktory].getElementsByTagName("img")[!ktory || ktory == (data.speed.length + 1) ? 0 : 1]) {
		x.src = sortDescending ? image_base + "list-up.png" : image_base + "list-down.png";
		sortDescending = sortDescending ? false : true;
	} else {
		table.rows[1].cells[ktory].innerHTML += "<img src='" + image_base + "list-down.png' >";
		sortDescending = true;
	}
	for (i = 0; i < table.rows[1].cells.length; i++) {
		if (i == ktory)
			continue;
		if (x = table.rows[1].cells[i].getElementsByTagName("img")[!i || i == (data.speed.length + 1) ? 0 : 1])
			x.remove();
	}

	$('[name="wybierz"]').each(function () {
		zaznaczone.push($(this).is(':checked'));
	});
	for (i = 2; i < table.rows.length - 1; i++) {
		if (table.rows[i].style.display == "none")
			continue;
		min = i;
		for (j = i + 1; j < table.rows.length; j++) {
			if (table.rows[j].style.display == "none")
				continue;
			if (ktory == 0)
				if (table.rows[sortDescending ? j : min].cells[ktory].textContent > table.rows[sortDescending ? min : j].cells[ktory].textContent)
					min = j;
			if (Number(table.rows[sortDescending ? j : min].cells[ktory].textContent) > Number(table.rows[sortDescending ? min : j].cells[ktory].textContent))
				min = j;
		}
		tmp = table.rows[min].innerHTML;
		table.rows[min].innerHTML = table.rows[i].innerHTML;
		table.rows[i].innerHTML = tmp;
		tmp2 = zaznaczone[i - 2];
		zaznaczone[i - 2] = zaznaczone[min - 2];
		zaznaczone[min - 2] = tmp2;
	}
	$('[name="wybierz"]').each(function (i) {
		$(this).prop('checked', zaznaczone[i]);
	});
}
function wybieranieWiosek() {
	var wiersz;

	okienko = "<tr><th style=\"cursor:pointer;\" onclick=\"ustaw_min(0); $('#wyborWojsk tr:has(td)').each(function(i){$(this).show();}); \">Quantidade mínima de tropas:";
	for (i = 0; i < data.speed.length; i++)
		okienko += "<th><input onchange=\"chowaj_wojska(" + i + ",this.value);\" type='text' value=" + minimumNumberTroops[i] + " size='1'>";

	okienko += "<th colspan=2><tr><th style=\"cursor:pointer;\" onclick=\"sortowanie_przegladu(" + (-1) + ");\" ><span class='icon header village' ></span>";
	for (i = 0; i < pictures.length; i++) {
		okienko += "<th style=\"cursor:pointer;\" onclick=\"sortowanie_przegladu(" + i + ");\" ><img src='" + img_wojsk + "unit_" + pictures[i] + ".png'>";
	}
	okienko += "<th style=\"cursor:pointer;\" onclick=\"sortowanie_przegladu(" + (pictures.length) + ");\" >Odl<th><input type='checkbox' onClick='zaznaczWszystko(this)'\" >";
	for (i = 0; i < troops.length; i++) {
		ukryty = false;
		komorki = "<a href=" + data.linkDoOverviewVillage + id[i] + ">" + nazwyWiosek[i].replace(/\s+/g, "\u00A0") + "</a>";
		for (j = 0; j < pictures.length; j++) {
			komorki += "<td>" + troops[i][j];
			if (!ukryty && troops[i][j] < minimumNumberTroops[i])
				ukryty = true;
		}
		if (!ukryty)
			wiersz = "<tr class='" + (i % 2 ? 'row_a' : 'row_b') + "'><td>";
		else
			wiersz = "<tr class='" + (i % 2 ? 'row_a' : 'row_b') + "' style=\"display: none;\"><td>";
		okienko += wiersz + komorki;

		okienko += "<td><td><input name='wybierz' type='checkbox' " + (pokazWies[i] ? 'checked' : "disabled") + ">";
	}
	$('#wyborWojsk').html(okienko);
	pokazOdleglosc();
}
function pokazOdleglosc() {
	document.getElementById('targetCoordinates').value = document.getElementById('targetCoordinates').value.match(/\d+\|\d+/);
	var cel = document.getElementById('targetCoordinates').value.match(/\d+/g);
	$("#wyborWojsk tr:has(td) td:nth-child(" + (data.speed.length + 2) + ")").each(function (i) {
		a = Math.abs(Number(cel[0]) - mojeWioski[i][mojeWioski[i].length - 3]);
		b = Math.abs(Number(cel[1]) - mojeWioski[i][mojeWioski[i].length - 2]);
		$(this).html(Number((Math.sqrt((a * a) + (b * b))).toFixed(1)));
	});
}
function zapiszWybrane() {
	$('#wyborWojsk input:checkbox').each(function (i) {
		if (i)
			pokazWies[i - 1] = $(this).is(':checked');
	});
	$('#wyborWojsk').hide();
	$("#lista_wojska").show();
}
function zmienStrzalke() {
	if ($("#strzaleczka").hasClass('arr_down')) {
		$("#strzaleczka").removeClass('arr_down');
		$("#strzaleczka").addClass('arr_up');
	} else {
		$("#strzaleczka").removeClass('arr_up');
		$("#strzaleczka").addClass('arr_down');
	};
}
function rysujPlaner() {
	var cel = game_data.village.x + "|" + game_data.village.y;
	if (game_data.screen == "info_village") {
		if (!mobile) {
			var table = document.getElementById("content_value").getElementsByClassName('vis')[0];
			table.getElementsByTagName("table")[0];
			cel = table.rows[2].cells[1].textContent;
		} else {
			table = document.getElementsByClassName('mobileKeyValue')[0].getElementsByTagName("div")[0];
			cel = table.textContent.match(/\d+\|\d+/);
		}
	}
	
	// não funciona corretamente no mundo com arcos e sem paladinos
	if ($('.village-note-body').length > 0) {
		czas_wejscia_notes = $('.village-note-body').html().match(/\d\d?:\d\d?:\d\d?/);
		if (czas_wejscia_notes && ($(".no_ignored_command").length == 0)) {
			czas_wejscia_notes = $('.village-note-body').html().match(/\d\d?:\d\d?:\d\d?/)[0].match(/\d\d?/g);
			currentTime.setSeconds(Number(czas_wejscia_notes[2]));
			currentTime.setMinutes(Number(czas_wejscia_notes[1]));
			currentTime.setHours(Number(czas_wejscia_notes[0]));
			}
	}
	//else {
	//	$("#time_for_troops").val($('#defaultTime').val());
	//}
		
	var pobralemCzas = false;
	if ($(".no_ignored_command").length)
		$(".no_ignored_command").each(function (i) {
			if (x = $(this).html().match("snob.png") && !pobralemCzas) {
				czas_wejscia_grubego = $(this).find("td:eq(2)").text().match(/\d+/g);
				currentTime.setSeconds(currentTime.getSeconds() + Number(czas_wejscia_grubego[2]) + (60 * Number(czas_wejscia_grubego[1])) + (3600 * Number(czas_wejscia_grubego[0])));
				pobralemCzas = true;
				return;
			}
		});
	var elem = "<div class='vis vis_item' style='overflow: auto; height: 300px;' id='slicePlanned'><table width='100%'><tr><td width='300'><table style=\"border-spacing: 3px; border-collapse: separate;\"><tr><th>Destino<th>Data<th>Hora<th>Aflição (%)<th>Grupo<th><th><th>Tempo padrão<tr><td><input size=8 type='text' onchange='pokazOdleglosc();' value='" + cel + "' id='targetCoordinates' /><td><input size=8 type='text' value='" + currentTime.getDate() + "." + (currentTime.getMonth() + 1) + "." + currentTime.getFullYear() + "' onchange=\"correctDate(this,'.');\" id='data_for_troops'/><td><input size=8 type='text' value='" + currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds() + "' onchange=\"correctDate(this,':');\" id='time_for_troops'/><td><input size=8 type='text' value='0' id='sigil'/><td><select id='listGrup' onchange=\"zmienGrupe();\"><option value='" + allUnits + "'>Todos</select><td onclick=\"zmienStrzalke(); if($('#wyborWojsk').is(':visible')){ $('#wyborWojsk').hide();$('#lista_wojska').show(); zapiszWybrane(); return;}	else{ $('#lista_wojska').hide(); $('#wyborWojsk').show();} \" style=\"cursor:pointer;\"><span id='strzaleczka' class='icon header arr_down' ></span><td><input type='button' class='btn' value='Calcular' onclick=\"wypiszMozliwosci();\" id='przycisk'><td><input size='8' type='text' id='defaultTime'><input type='button' class='btn' value='Salvar' onclick=\"setDefalutTimeLocalStorage();\"></table><td id='ladowanie'><img src='" + image_base + "throbber.gif' />";
	elem += "<tr><td colspan=2 width='100%'><table style=\"display: none; border-spacing: 3px; border-collapse: separate;\" id='wyborWojsk' width='100%'></table><table style=\"border-spacing: 3px; border-collapse: separate;\" id='lista_wojska' width='100%'><thead><tr><th id='ilosc_mozliwosci'><span class='icon header village' ></span>";
	
	for (i = 0; i < pictures.length; i++)
		elem += "<th style=\"cursor:pointer;\" class='" + (ActiveTroops[i] == "0" ? "faded" : "") + "' onClick=\"if(this.className == 'faded') this.className=''; else this.className='faded';\"><img title='" + data.namesTroops[i] + "' src='" + img_wojsk + "unit_" + pictures[i] + ".png'>";
	elem += "<th>Hora de Saída<th><span class=\'icon header time\'><th><b>Ordem</b></thead>";
	elem += "<tbody></table></table></div>";	
	$(mobile ? "#mobileContent" : "#contentContainer").prepend(elem);
	
	
	$("#data_for_troops").after("<button id='data_btn'>+</button>");
	$("#data_btn").click(
		function(){
			var d = new Date();
			d.setDate(d.getDate() + 1);
			$("#data_for_troops").val(d.toLocaleDateString());}
	);
	$("#time_for_troops").after("<button id='time_btn'>⇄</button>");
	$("#time_btn").click(
		function(){
			if($("#time_for_troops").val() == $('#defaultTime').val()){
				//$("#time_for_troops").val("7:00:00");
				$("#time_for_troops").val(currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds())
			}
			else{
				$("#time_for_troops").val($('#defaultTime').val());
			}}
	);
	getDefalutTimeLocalStorage();
	wypiszMozliwosci();
}
function correctDate(elem, sep) {
	x = elem.value.match(/\d+/g);
	elem.value = x[0] + sep + x[1] + sep + x[2];
}
function downloadData() {
	loading = true;
	var r;
	r = new XMLHttpRequest();
	r.open('GET', data.linkDoUnits, true);
	function processResponse() {
		if (r.readyState == 4 && r.status == 200) {
			requestedBody = document.createElement("body");
			requestedBody.innerHTML = r.responseText;
			var table = $(requestedBody).find('#units_table').get()[0];

			var grupy = $(requestedBody).find('.vis_item').get()[0].getElementsByTagName(mobile ? 'option' : 'a');
			if (!table) {
				$("#ladowanie").html("No grupo selecionado não há aldeias, escolha outro grupo.");
				loading = false;
				return;
			}
			for (i = 1; i < table.rows.length; i++) {
				pokazWies[i - 1] = true;
				troops[i - 1] = [];
				emptyVillage = 0;
				for (j = 2; j < table.rows[i].cells.length - 1; j++) {
					troops[i - 1].push(table.rows[i].cells[j].textContent);
					if (!Number(troops[i - 1][j - 2]))
						emptyVillage++;
				}
				if (emptyVillage > data.speed.length)
					pokazWies[i - 1] = false;
				id.push(table.rows[i].cells[0].getElementsByTagName('span')[0].getAttribute("data-id"));
				mojeWioski.push(table.rows[i].cells[0].getElementsByTagName('span')[2].textContent.match(/\d+/g));
				nazwyWiosek.push(table.rows[i].cells[0].getElementsByTagName('span')[2].textContent);
			}
			wybieranieWiosek();
			if (downloadedGroup && $('#lista_wojska').is(':visible'))
				wypiszMozliwosci();
			if (!downloadedGroup) {
				for (i = 0; i < grupy.length; i++) {
					nazwa = grupy[i].textContent;
					if (mobile && grupy[i].textContent == "Todos")
						continue;
					$("#listGrup").append($('<option>', {
							value: grupy[i].getAttribute(mobile ? "value" : "href") + "&page=-1",
							text: mobile ? nazwa : nazwa.slice(1, nazwa.length - 1)
						}));
				}

				downloadedGroup = true;
			}

			$("#ladowanie").html("");
			loading = false;
		};
	}
	r.onreadystatechange = processResponse;
	r.send(null);
}

function configurationWorld() {
	var dt;
	$.ajax({
		'async': false,
		'url': '/interface.php?func=get_config',
		'dataType': 'xml',
		'success': function (data) {
			dt = data;
		}
	});
	return dt;
}
function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ')
			c = c.substring(1);
		if (c.indexOf(name) != -1)
			return c.substring(name.length, c.length);
	}
	return "";
}
function setCookie(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	var expires = "expires=" + d.toGMTString();
	if (exdays == 0)
		expires = "";
	document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getDefalutTimeLocalStorage() {
	if(localStorage.getItem('defaultTime')) {
		$('#defaultTime').val(localStorage.getItem('defaultTime'));
	} else {
		$('#defaultTime').val('7:00:00');
	}
	
}
function setDefalutTimeLocalStorage() {
	if($('#defaultTime')) {
		localStorage.setItem('defaultTime', $('#defaultTime').val());
	}
}