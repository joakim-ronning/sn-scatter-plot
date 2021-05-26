import {
  useEffect,
  useState,
  useStaleLayout,
  useTheme,
  useTranslator,
  useApp,
  useAppLayout,
  useModel,
  useOptions,
  useRect,
  useSelections,
  usePlugins,
} from '@nebula.js/stardust';
import {
  layoutService as createLayoutService,
  themeService as createThemeService,
  dockService as createDockService,
  pluginService as createPluginService,
} from '@qlik/chart-modules';
import themeStyleMatrix from '../services/theme-service/theme-style-matrix';
import layoutServiceMeta from '../services/layout-service/meta';
import createChartModel from '../models/chart-model';
import createTickModel from '../models/tick-model';
import createSelectionModel from '../models/selection-model';
import createColorService from '../services/color-service';
import getLogicalSize from '../logical-size';
import createExtremumModel from '../models/extremum-model';
import createDisclaimerModel from '../models/disclaimer-model';

const useModels = ({ core, flags }) => {
  const layout = useStaleLayout();
  const theme = useTheme();
  const model = useModel();
  const translator = useTranslator();
  const options = useOptions();
  const rect = useRect();
  const selections = useSelections();
  const app = useApp();
  const { qLocaleInfo: localeInfo } = useAppLayout();
  const plugins = usePlugins();
  const [selectionModel, setSelectionModel] = useState();
  const [models, setModels] = useState();

  useEffect(() => {
    if (!core) {
      return () => {};
    }

    const { chart, actions } = core;
    const sm = createSelectionModel({
      chart,
      actions,
      selections,
      document,
    });

    setSelectionModel(sm);

    return () => {
      sm.command.destroy();
    };
  }, [core]);

  useEffect(() => {
    if (!layout || !selectionModel) {
      return;
    }

    const { picassoInstance, chart, actions, viewState } = core;
    const layoutService = createLayoutService({ source: layout, metaAdditionsFn: layoutServiceMeta });
    const logicalSize = getLogicalSize({ layout: layoutService.getLayout(), options });
    const dockService = createDockService({
      chart,
      layoutService,
      config: {
        logicalSize: logicalSize || rect,
        rtl: options.direction === 'rtl',
      },
      typeConfig: {
        type: 'x-y',
      },
    });
    const themeService = createThemeService({ theme, styleMatrix: themeStyleMatrix });
    const pluginService = createPluginService({ picassoInstance, layout, plugins });
    const extremumModel = createExtremumModel(layoutService, options.viewState);
    const colorService = createColorService({
      actions,
      localeInfo,
      app,
      chart,
      theme,
      translator,
      options,
      model,
      layoutService,
      picasso: picassoInstance,
      viewState,
    });

    const chartModel = createChartModel({
      chart,
      localeInfo,
      layoutService,
      dockService,
      model,
      picasso: picassoInstance,
      options,
      viewState,
      colorService,
      extremumModel,
    });

    const tickModel = createTickModel({ layoutService, dockService, extremumModel, themeService, chartModel, chart });

    const disclaimerModel = createDisclaimerModel({ layoutService, flags });

    selectionModel.command.setLayout({ layout });
    setModels({
      layoutService,
      tickModel,
      chartModel,
      dockService,
      selectionModel,
      themeService,
      pluginService,
      disclaimerModel,
      colorService,
      extremumModel,
    });
  }, [model, app, selectionModel, layout, theme.name(), translator.language(), options.direction, options.viewState]);

  return models;
};

export default useModels;
