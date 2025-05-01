const { WeappTailwindcssDisabled } = require('weapp-tailwindcss-webpack-plugin');

/** @type {import('postcss').Config} */
module.exports = {
  plugins: [
    require('tailwindcss')(),
    require('autoprefixer')(),
    WeappTailwindcssDisabled(),
  ],
}; 