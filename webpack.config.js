const path = require('path');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');

function pathToName(file){
	return path.parse(file).name
}

module.exports = {
  // Evil coding hack to load all typescript files
  entry: glob.sync(['src/**/*.ts', 'src/**/*.js']).reduce(function(obj, el){
     obj[pathToName(el)] = "./" + el;
     return obj
  },{}),
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [/node_modules/],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  mode: "development",
  devtool: "source-map",
  // Auto inject scripts into html files 
  plugins: glob.sync("src/pages/**/*.html").map((html_file) => {
  	const nm = pathToName(html_file)
  	const out = `pages/${nm}.html`
  	return new HtmlWebpackPlugin({
  		filename: out,
  		template: html_file,
  		chunks: glob.sync(`src/pages/**/${nm}.ts`).map(pathToName)
  	})
  })
   
};
