/*
* Small simple testcode
*
* Copyright (C) 25. Jan 2010  Konstantin Weitz
*
* This program is free software; you can redistribute it and/or modify it under
* the terms of the GNU General Public License as published by the Free Software
* Foundation; either version 3 of the License, or (at your option) any later 
* version.
*
* This program is distributed in the hope that it will be useful, but WITHOUT
* ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
* FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License along with 
* this program; if not, see <http://www.gnu.org/licenses/>.
*/


Chart.prototype.generate_annuitaet = function(schuld,zins,tilg,aufloesung){
	if(schuld!=0 && zins!=0 && tilg!=0 && aufloesung!=0) {
		var monat = 0;
		var annu = schuld*(zins+tilg)/100.0/aufloesung;
	
		var zinsGeld = 0;
		var tilgGeld = 0;

		var aSchuld = new Array();
		var aZins = new Array();
		var aTilg = new Array();

		while(schuld > 0.0){
			aSchuld.push(schuld);

			zinsGeld = schuld*zins/100.0/aufloesung;
			tilgGeld = annu-zinsGeld;
			schuld -= tilgGeld;

			aZins.push(zinsGeld);
			aTilg.push(tilgGeld);
		
			++monat;
		}

		this.add_series("Remaining Debt", aSchuld);
		this.add_series("Interest",aZins);
		this.add_series("Clearance",aTilg);

		this.maxLen = Math.max(this.maxLen,3);
	}
}
