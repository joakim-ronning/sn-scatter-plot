import { getValue } from 'qlik-chart-modules';
import showCompressionResolution from '../show-compression-resolution';
import colorModeOptions from '../color-mode-options';
import showUseDimValCol from '../show-use-dim-val-col';
import compressionNoteProperties from './compression-note-properties';

const persistentColorsShow = (data) => !getValue(data, 'color.auto') && getValue(data, 'color.mode') === 'byDimension';

export default function propertyDefinition(env) {
  const settings = {
    uses: 'settings',
    items: {
      general: {
        items: {
          showDisclaimer: {
            translation: 'properties.showDisclaimer',
            type: 'boolean',
            ref: 'showDisclaimer',
            component: 'switch',
            defaultValue: true,
            options: [
              {
                value: true,
                translation: 'Common.Show',
              },
              {
                value: false,
                translation: 'properties.hide',
              },
            ],
          },
        },
      },
      presentation: {
        type: 'items',
        translation: 'properties.presentation',
        grouped: true,
        items: {
          showNavigation: {
            ref: 'navigation',
            type: 'boolean',
            translation: 'Common.Navigation',
            component: 'switch',
            defaultValue: false,
            options: [
              {
                value: true,
                translation: 'Common.Auto',
              },
              {
                value: false,
                translation: 'properties.off',
              },
            ],
          },
          bubbleSizeItems: {
            type: 'items',
            items: {
              bubbleSizes: {
                type: 'integer',
                component: 'slider',
                ref: 'dataPoint.bubbleSizes',
                translation: 'properties.dataPoints.bubbleSizes',
                min: 1,
                max: 20,
                step: 1,
                defaultValue: 5,
                show(data) {
                  return data.qHyperCubeDef.qMeasures.length < 3;
                },
              },
              rangeBubbleSizes: {
                type: 'array',
                component: 'slider',
                ref: 'dataPoint.rangeBubbleSizes',
                translation: 'properties.dataPoints.bubbleSizes',
                min: 1,
                max: 20,
                step: 1,
                defaultValue: [2, 8],
                show(data) {
                  return data.qHyperCubeDef.qMeasures.length >= 3;
                },
              },
              rangeBubbleCompressionNote: compressionNoteProperties,
            },
          },
          label: {
            type: 'items',
            items: {
              labelMode: {
                ref: 'labels.mode',
                translation: 'properties.labels',
                type: 'string',
                component: 'dropdown',
                defaultValue: 1,
                options: [
                  {
                    value: 1,
                    translation: 'Common.Auto',
                  },
                  {
                    value: 2,
                    translation: 'Common.All',
                  },
                  {
                    value: 0,
                    translation: 'Common.None',
                  },
                ],
                snapshot: {
                  tid: 'property-labels',
                },
              },
              labelModeCompressionNote: compressionNoteProperties,
            },
          },
          queryLevel: {
            type: 'integer',
            component: 'slider',
            ref: 'compressionResolution',
            translation: 'properties.compression.resolution',
            min: 4,
            max: 8,
            step: 1,
            defaultValue: 5,
            show(data, handler) {
              return showCompressionResolution(handler.layout);
            },
          },
          gridLines: {
            type: 'items',
            snapshot: {
              tid: 'property-gridLines',
            },
            items: {
              showGridLines: {
                ref: 'gridLine.auto',
                type: 'boolean',
                translation: 'properties.gridLine.spacing',
                component: 'switch',
                defaultValue: true,
                options: [
                  {
                    value: true,
                    translation: 'Common.Auto',
                  },
                  {
                    value: false,
                    translation: 'Common.Custom',
                  },
                ],
              },
              gridSpacing: {
                ref: 'gridLine.spacing',
                type: 'number',
                component: 'dropdown',
                defaultValue: 2,
                options: [
                  {
                    value: 0,
                    translation: 'properties.gridLine.noLines',
                  },
                  {
                    value: 1,
                    translation: 'properties.gridLine.wide',
                  },
                  {
                    value: 2,
                    translation: 'properties.gridLine.medium',
                  },
                  {
                    value: 3,
                    translation: 'properties.gridLine.narrow',
                  },
                ],
                show(data) {
                  return !data.gridLine.auto;
                },
              },
            },
          },
        },
      },
      colorsAndLegend: {
        uses: 'colorsAndLegend',
        items: {
          colors: {
            items: {
              colorsAnLegendCompressionNote: compressionNoteProperties,
              colorMode: {
                options: colorModeOptions,
              },
              persistentColors: {
                show(data) {
                  if (showUseDimValCol(data)) {
                    // If we allow dim value colors, then only show persistence settings if it is off
                    return persistentColorsShow(data) && !getValue(data, 'color.useDimColVal');
                  }
                  return persistentColorsShow(data);
                },
              },
            },
          },
          legend: {
            show(data) {
              const { auto, mode, expressionIsColor } = data.color;
              return !auto && mode !== 'primary' && (mode !== 'byExpression' || !expressionIsColor);
            },
          },
        },
      },
      xAxis: {
        type: 'items',
        uses: 'axis.measureAxis',
        label(properties, handler) {
          let label;
          const measure = handler.getMeasureLayouts()[0];

          if (measure && !measure.qError) {
            label = env.translator.get('properties.xAxisWithInfo', [measure.qFallbackTitle]);
          } else {
            label = env.translator.get('properties.xAxis');
          }

          return label;
        },
        items: {
          axis: {
            items: {
              show: {
                ref: 'xAxis.show',
                snapshot: {
                  title: 'properties.xAxis',
                  tid: 'property-xAxis',
                },
              },
              dock: {
                ref: 'xAxis.dock',
                show(data) {
                  return data.xAxis.show !== 'none';
                },
                options: [
                  {
                    value: 'near',
                    translation: 'Common.Bottom',
                  },
                  {
                    value: 'far',
                    translation: 'Common.Top',
                  },
                ],
              },
              spacing: {
                ref: 'xAxis.spacing',
                show(data) {
                  return data.xAxis.show !== 'none';
                },
              },
            },
          },
          minMax: {
            type: 'items',
            items: {
              autoMinMax: {
                ref: 'xAxis.autoMinMax',
              },
              minMax: {
                ref: 'xAxis.minMax',
                show(data) {
                  return !data.xAxis.autoMinMax;
                },
              },
              min: {
                ref: 'xAxis.min',
                show(data) {
                  return ['min', 'minMax'].includes(data.xAxis.minMax) && !data.xAxis.autoMinMax;
                },
                invalid(data) {
                  if (data.xAxis.minMax === 'minMax') {
                    return data.xAxis.min >= data.xAxis.max;
                  }
                  return false;
                },
              },
              max: {
                ref: 'xAxis.max',
                show(data) {
                  return ['max', 'minMax'].includes(data.xAxis.minMax) && !data.xAxis.autoMinMax;
                },
                invalid(data) {
                  if (data.xAxis.minMax === 'minMax') {
                    return data.xAxis.min >= data.xAxis.max;
                  }
                  return false;
                },
              },
            },
          },
        },
      },
      yAxis: {
        type: 'items',
        uses: 'axis.measureAxis',
        label(properties, handler) {
          let label;
          const measure = handler.getMeasureLayouts()[1];

          if (measure && !measure.qError) {
            label = env.translator.get('properties.yAxisWithInfo', [measure.qFallbackTitle]);
          } else {
            label = env.translator.get('properties.yAxis');
          }

          return label;
        },
        items: {
          axis: {
            items: {
              show: {
                ref: 'yAxis.show',
                snapshot: {
                  title: 'properties.yAxis',
                  tid: 'property-yAxis',
                },
              },
              dock: {
                ref: 'yAxis.dock',
                show(data) {
                  return data.yAxis.show !== 'none';
                },
                options(data, handler, args) {
                  const nearStr = args.yMirrorMode ? 'properties.dock.right' : 'properties.dock.left';
                  const farStr = args.yMirrorMode ? 'properties.dock.left' : 'properties.dock.right';
                  return [
                    { value: 'near', translation: nearStr },
                    { value: 'far', translation: farStr },
                  ];
                },
              },
              spacing: {
                ref: 'yAxis.spacing',
                show(data) {
                  return data.yAxis.show !== 'none';
                },
              },
            },
          },
          minMax: {
            type: 'items',
            items: {
              autoMinMax: {
                ref: 'yAxis.autoMinMax',
              },
              minMax: {
                ref: 'yAxis.minMax',
                show(data) {
                  return !data.yAxis.autoMinMax;
                },
              },
              min: {
                ref: 'yAxis.min',
                show(data) {
                  return ['min', 'minMax'].includes(data.yAxis.minMax) && !data.yAxis.autoMinMax;
                },
                invalid(data) {
                  if (data.yAxis.minMax === 'minMax') {
                    return data.yAxis.min >= data.yAxis.max;
                  }
                  return false;
                },
              },
              max: {
                ref: 'yAxis.max',
                show(data) {
                  return ['max', 'minMax'].includes(data.yAxis.minMax) && !data.yAxis.autoMinMax;
                },
                invalid(data) {
                  if (data.yAxis.minMax === 'minMax') {
                    return data.yAxis.min >= data.yAxis.max;
                  }
                  return false;
                },
              },
            },
          },
        },
      },
      tooltips: {
        uses: 'tooltip',
      },
    },
  };

  const data = {
    uses: 'data',
  };

  const addons = {
    type: 'items',
    component: 'expandable-items',
    translation: 'properties.addons',
    items: {
      refLinesX: {
        uses: 'reflines',
        ref: 'refLine.refLinesX',
        translation: 'properties.referenceLinesX',
        items: {
          colorBackground: {
            show: false,
          },
        },
      },
      refLinesY: {
        uses: 'reflines',
        ref: 'refLine.refLinesY',
        translation: 'properties.referenceLinesY',
        items: {
          colorBackground: {
            show: false,
          },
        },
      },
      dataHandling: {
        uses: 'dataHandling',
        items: {
          calcCond: {
            uses: 'calcCond',
          },
        },
      },
    },
  };

  return {
    type: 'items',
    component: 'accordion',
    items: {
      data,
      addons,
      settings,
    },
  };
}
