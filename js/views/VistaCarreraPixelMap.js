// visCarreras
define([
	'underscore',
	'backbone',
	'jquery',
	'd3',
	], function(_, Backbone,$, d3){

	var VistaCarreraPixelMap = Backbone.View.extend(
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
			this.data = (this.options && this.options.data) ? this.options.data : [];
			this.width = (this.options && this.options.width) ? this.options.width : 1000;
			this.radious = (this.options && this.options.radious) ? this.options.radious : 3;
			this.maxColumns = Math.floor(this.width/(this.radious*2));
			this.maxRows = Math.ceil(this.data.length/this.maxColumns);
			this.indent = (this.options && this.options.indent) ? this.options.indent : 0;
			this.label = (this.options && this.options.label) ? this.options.label : "";
			this.label2 = (this.options && this.options.label2) ? this.options.label2 : "";
			this.tooltip = (this.options && this.options.tooltip) ? this.options.tooltip : "";
			this.render();
		},

		/**
		* Despliegue inicial de elementos gráficos.
		*/
		render: function() {
			var self = this;
			var data = this.data;
			var maxColumns = this.maxColumns;
			var radious = this.radious;
			var maxRows = this.maxRows;

			var w = this.width;
			var h = maxRows*radious*2+radious;

			var svg = d3.select(this.el).attr("width", w).attr("height", h)

			label1 = svg.append("text")
				.text(this.label)
				.attr("font-family", "sans-serif")
				.attr("x", "0").attr("y", "20")
			  	.attr("font-size", "10px")
			    .attr("fill", "gray");

			if (this.label2) {
				label1.attr("y", "10")
				svg.append("text")
					.text(this.label2)
					.attr("font-family", "sans-serif")
					.attr("x", "0").attr("y", "20")
			      	.attr("font-size", "10px")
			        .attr("fill", "gray");
			}


			this.nodes = svg.selectAll("rect.node-dot")
			     .data(data, function(d) { return d.CODIGO_UNICO; })
			     .enter()
			     	.append("svg:rect")
			     	.attr("class", "node-dot")
			     	.attr("width", radious)
			     	.attr("height", radious)
			     	.attr("class", function(d) {
						var myclass = "node-dot";
						myclass += d.ACREDITACION_CARRERA=="Acreditada" ? " acreditada" : " noAcreditada";
						return myclass;
					})
			     	.attr("x", function(d, i)
			     	{
			     		var row = Math.floor(i/maxColumns);
			     		var col = i % maxColumns;
			     		var x = col*radious*2 + radious;
			     		var y = row*radious*2 + radious;
			     		return x;
			     	})
			     	.attr("y", function(d, i)
			     	{
			     		var row = Math.floor(i/maxColumns);
			     		var col = i % maxColumns;
			     		var x = col*radious*2 + radious;
			     		var y = row*radious*2 + radious;
			     		return y+20;
			     	})
			     	.on("mouseover", function(d) {
			     		pos = {x:d3.event.pageX-$("body").offset().left, y:d3.event.pageY}
						self.tooltip.show(d, pos)}
						)
					.on("mouseout", function(d) {self.tooltip.hide()})

		}

	});
  
  return VistaCarreraPixelMap;
});

