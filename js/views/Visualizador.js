// template
define([
	'underscore',
	'backbone',
	'jquery',
	'd3',
	'sankey',
	'VistaTooltip',
	'VistaEjesXY',
	'VistaLegendSVG',
	'views/VistaCarreraPixelMap',

	], function(_, Backbone,$, d3,d3sankey, VistaTooltip, VistaEjesXY, VistaLegendSVG, VistaCarreraPixelMap){

	var Visualizador = Backbone.View.extend(
		/** @lends Visualizador.prototype */
		{

		/**
		* @class VistaPrincipal vista que despliega visualizacion de ingresos vs costos de carreras
		*
		* @augments Backbone.View
		* @constructs
		*
		* @param {object} options parametros de incializacion
		* @param {array} options.data arreglo con datos (cada dato es un objeto con atributos)
		* @param {d3.select()} options.svg elemento SVG utilizado como contenedor del gráfico
		* @param {Backbone.View} options.tooltip vista utilizada como tooltip
		* Visualizador Inicia parametros de configuración y llamada a datos
		*/
		initialize: function() {
			this.data = this.options && this.options.data ? this.options.data : [];

			// Binding de this (esta vista) al contexto de las funciones indicadas
			_.bindAll(this,"render", "tootipMessage")

			// Alias a this para ser utilizado en callback functions
			var self = this; 
			
			// Configuración de espacio de despliegue de contenido en pantalla
			this.margin = {top: 20, right: 20, bottom: 30, left: 20},
	    	this.width = 1000 - this.margin.left - this.margin.right,
	    	this.height = 400 - this.margin.top - this.margin.bottom;

	   		this.color = d3.scale.category20c();

			// Vista con tooltip para mostrar datos del item respectivo
			this.tooltip = new VistaTooltip();
			this.tooltip.message = this.tootipMessage;

			this.color = d3.scale.category20();

			// append the svg canvas to the page
			this.svg = d3.select(this.el)
			    .attr("width", this.width + this.margin.left + this.margin.right)
			    .attr("height", this.height + this.margin.top + this.margin.bottom)
			  .append("g")
			    .attr("transform", 
			          "translate(" + this.margin.left + "," + this.margin.top + ")");


			this.render();
	 
		},

		/**
		* Reescribe función generador de mensajes utilizado en herramienta de tooltip
		* tooltip.tooltipMessage(data) 	
		*
		* @param {object} data objeto con atributos (Ej: {nombre: "Juan", Edad: 18}) utilizados en la creación del mensaje a desplegar por tooltip
		* @returns {string} Mensaje (html) a ser utilizado por tooltip
		*/
		tootipMessage : function(d) {
			// Atributos
			// CODIGO_UNICO	TIPO_INSTITUCION	INSTITUCION	SEDE	REGION	CARRERA	HORARIO	NOTAS_EM	PRUEBA_LENGUAJE	PRUEBA_MATEMATICAS	PRUEBA_HISTORIA	PRUEBA_CIENCIAS	OTROS	VACANTES_PRIMER_SEMESTRE	VACANTES_SEGUNDO_SEMESTRE	VALOR_MATRICULA	VALOR_ARANCEL	DURACION_SEMESTRES	AREA	ACREDITACION_CARRERA
			var msg = "<span class='text-info'>"+d.CARRERA+"</span>";
			msg += "<br>"+ d.INSTITUCION;
			msg += "<br>Sede: "+ d.SEDE;
			msg += "<br>Horario: "+ d.HORARIO;
			msg += "<br>Horario: "+ d.ACREDITACION_CARRERA;
			return msg;
		}, 

		/**
		* Despliegue inicial de elementos gráficos.
		*/
		render: function() {
			var self = this; // Auxiliar para referirse a this en funciones callback

			// Ordenar datos segñun acreditación
			this.data = _.sortBy(this.data, function(d) {return d.ACREDITACION_CARRERA});		

			// Generar arreglos con datos por tipo de institución
			var dataIP =  _.filter(this.data, function(d) {return d.TIPO_INSTITUCION=="INSTITUTO PROFESIONAL"});
			var dataUParticular =  _.filter(this.data, function(d) {return d.TIPO_INSTITUCION=="UNIVERSIDAD PARTICULAR"});
			var dataUEstatal =  _.filter(this.data, function(d) {return d.TIPO_INSTITUCION=="UNIVERSIDAD ESTATAL"});
			var dataCFT =  _.filter(this.data, function(d) {return d.TIPO_INSTITUCION=="CENTRO DE FORMACIÓN TÉCNICA"});
			var dataUParticularConAporte =  _.filter(this.data, function(d) {return d.TIPO_INSTITUCION=="UNIVERSIDAD PARTICULAR CON APORTE"});

			var radious = 2.5

			// Calcular el ancho de cada grupo tipo de IE como proporción del ancho total
			var widthCFT = Math.ceil(this.width*dataCFT.length/this.data.length);
			var widthIP = Math.ceil(this.width*dataIP.length/this.data.length);
			var widthUEstatal= Math.ceil(this.width*dataUEstatal.length/this.data.length);
			var widthUParticular = Math.ceil(this.width*dataUParticular.length/this.data.length);
			var widthUParticularConAporte= Math.ceil(this.width*dataUParticularConAporte.length/this.data.length);

			// Calcular posición x de cada tipo de IE
			var uMargin = 3
			var xCFT = 0;
			var xIP = xCFT+widthCFT+uMargin;
			var xUEstatal = xIP+widthIP+uMargin;
			var xUParticularConAporte = xUEstatal+widthUEstatal+uMargin;
			var xUParticular = xUParticularConAporte+widthUParticularConAporte+uMargin;

			/// Contenedor principal SVG
			// ------------------------
			// Genera elemento SVG contenedor principal de gráficos
			this.svg = d3.select(this.el).append("svg")
			    .attr("width", this.width + this.margin.left + this.margin.right)
			    .attr("height", this.height + this.margin.top + this.margin.bottom)
			  .append("g")
			    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");



			this.colorScale = d3.scale.ordinal()
				.range(["blue", "red"])
				.domain(["Acredidata", "No Acredidata"])

			this.legend = new VistaLegendSVG({
				svg : this.svg, 	// Elemento SVG en el cual se ubica la leyenda
				scale : this.colorScale, // Escala ordinal con colores (range) para un dominio (domain)
				left: this.width, 	// Ubicacción horizontal del extremo DERECHO de la leyenda
				top: -20,
				left: 120});



			// Genera el contenedor para cada tipo de IE y construyye la vista asociada
			var svgCFT = this.svg.append("svg").attr("x", xCFT).attr("class","pixelmaps CFT");
			var pixelMap = new VistaCarreraPixelMap({el:"svg.pixelmaps.CFT", data: dataCFT, width:widthCFT, radious:radious, label:"CFT", tooltip: this.tooltip});

			var svgIP = this.svg.append("svg").attr("x", xIP).attr("class","pixelmaps IP");
			var pixelMap = new VistaCarreraPixelMap({el:"svg.pixelmaps.IP", data: dataIP, width:widthIP, radious:radious, label:"IP", tooltip: this.tooltip});

			var svgUEstatal = this.svg.append("svg").attr("x", xUEstatal).attr("class","pixelmaps UEstatal");
			var pixelMap = new VistaCarreraPixelMap({el:"svg.pixelmaps.UEstatal", data: dataUEstatal, width:widthUEstatal, radious:radious, label:"U. Estatal", tooltip: this.tooltip});

			var svgUParticularConAporte = this.svg.append("svg").attr("x", xUParticularConAporte).attr("class","pixelmaps UParticularConAporte");
			var pixelMap = new VistaCarreraPixelMap({el:"svg.pixelmaps.UParticularConAporte", data: dataUParticularConAporte, width:widthUParticularConAporte, radious:radious, label:"U. Part.", label2:"c/Aporte", tooltip: this.tooltip});

			var svgUParticular = this.svg.append("svg").attr("x", xUParticular).attr("class","pixelmaps UParticular");
			var pixelMap = new VistaCarreraPixelMap({el:"svg.pixelmaps.UParticular", data: dataUParticular, width:widthUParticular, radious:radious, label:"U. Particular", tooltip: this.tooltip});

			d3.select(this.el)
				.append("div")
				.attr("class","mute")
				.text("Fuente: http://www.mifuturo.cl/images/Base_de_datos/Oferta_academica/oapregrado2012.rar (16464 registros)")
			}


		

	});
  
  return Visualizador;
});

