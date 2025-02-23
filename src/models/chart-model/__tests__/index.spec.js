import * as KEYS from '../../../constants/keys';
import createChartModel from '..';
import * as createViewHandler from '../../../view-handler';

describe('chart-model', () => {
  let sandbox;
  let chart;
  let localeInfo;
  let hyperCube;
  let layoutService;
  let colorService;
  let picassoInstance;
  let picassoDataFn;
  let colorModelDataFn;
  let create;
  let viewHandler;
  let viewState;
  let extremumModel;
  let dataPages;
  let dataHandler;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    global.requestAnimationFrame = (cb) => {
      cb();
    };
    dataPages = [
      { qElemNumber: 7954, qNum: 1, qState: 'L', qText: [1732, 6, 1765, 5] },
      { qElemNumber: 7946, qNum: 1, qState: 'L', qText: [1599, 5, 1632, 4] },
    ];
    viewHandler = {
      getMeta: sandbox.stub().returns('isHomeState'),
      getInteractionInProgress: sandbox.stub(),
      getDataView: sandbox.stub(),
    };
    dataHandler = {
      getMeta: sandbox.stub().returns({ isBinnedData: false }),
      binArray: () => dataPages,
      fetch: () => Promise.resolve({ isBinnedData: true }),
      getHomeStateBins: sandbox.stub(),
    };
    sandbox.stub(createViewHandler, 'default').returns(viewHandler);
    viewState = {
      get() {
        return this.props;
      },
      set(p) {
        this.props = p;
      },
      onChanged(key, cb) {
        this[key] = cb;
      },
    };
    sandbox.stub(KEYS, 'default').value({
      COMPONENT: { MINI_CHART_POINT: 'mcp', X_AXIS_TITLE: 'xat', Y_AXIS_TITLE: 'yat' },
      DATA: { MAIN: 'dm', BIN: 'db' },
      FIELDS: { BIN: 'fb', BIN_X: 'fbx', BIN_Y: 'fby', BIN_DENSITY: 'fbd' },
    });
    chart = {
      update: sandbox.stub(),
      layoutComponents: sandbox.stub(),
      component: sandbox.stub(),
    };
    chart.component.withArgs('mcp').returns('mini-chart-component');
    localeInfo = { key: 'locale-info' };
    hyperCube = {
      dataPages: [{ key: 'page-0' }, { key: 'page-1' }],
    };
    layoutService = {
      meta: { isContinuous: false, isSnapshot: false, isBigData: false },
      getHyperCube: sandbox.stub().returns(hyperCube),
    };
    extremumModel = { command: { updateExtrema: sandbox.stub() } };
    colorModelDataFn = sandbox.stub().returns([{ colorData: 'oh yes' }]);
    colorService = {
      getData: colorModelDataFn,
    };
    picassoDataFn = sandbox.stub().returns('correct dataset');
    picassoInstance = {
      data: () => picassoDataFn,
    };
    create = () =>
      createChartModel({
        chart,
        localeInfo,
        layoutService,
        colorService,
        picasso: picassoInstance,
        viewState,
        extremumModel,
        dataHandler,
      });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should expose correct composition', () => {
    expect(create()).to.have.all.keys(['query', 'command']);
  });

  it('should prepare dataset properly', () => {
    create();
    expect(picassoDataFn).to.have.been.calledWith({
      key: 'dm',
      data: hyperCube,
      config: {
        localeInfo,
      },
    });
  });

  describe('query', () => {
    it('should have correct properties', () => {
      expect(create().query).to.have.all.keys([
        'getViewState',
        'getViewHandler',
        'getDataHandler',
        'getLocaleInfo',
        'isPrelayout',
        'getFormatter',
        'miniChartEnabled',
      ]);
    });

    describe('getViewState', () => {
      it('should return correct viewstate object', () => {
        expect(create().query.getViewState()).to.have.all.keys(['get', 'set', 'onChanged', 'dataView']);
      });
    });

    describe('getViewHandler', () => {
      it('should return correct view handler object', () => {
        expect(create().query.getViewHandler().getMeta()).to.equal('isHomeState');
      });
    });

    describe('getDataHandler', () => {
      it('should return correct data handler object', () => {
        expect(create().query.getDataHandler()).to.have.all.keys(['getMeta', 'binArray', 'fetch', 'getHomeStateBins']);
      });
    });

    describe('getLocaleInfo', () => {
      it('should return correct locale info', () => {
        expect(create().query.getLocaleInfo()).to.deep.equal({ key: 'locale-info' });
      });
    });

    describe('isPrelayout', () => {
      it('should return correct isPrelayout value', () => {
        expect(create().query.isPrelayout()).to.equal(true);
      });
    });

    describe('getFormatter', () => {
      it('should return correct getFormatter value', () => {
        picassoDataFn.returns({
          field: sandbox
            .stub()
            .withArgs('x')
            .returns({ formatter: sandbox.stub().returns('x-formatter') }),
        });
        expect(create().query.getFormatter('x')).to.deep.equal('x-formatter');
      });
    });
  });

  describe('command', () => {
    it('should expose correct methods', () => {
      expect(create().command).to.have.all.keys(['layoutComponents', 'update']);
    });

    describe('layoutComponents', () => {
      it('should call layoutComponents correctly', () => {
        create().command.layoutComponents({ settings: { key: 'settings' } });
        const argsObject = chart.layoutComponents.args[0][0];

        expect(chart.layoutComponents).to.have.been.calledOnce;
        expect(argsObject.data).to.be.an('array');
        expect(argsObject.data[0].config.localeInfo).to.equal(localeInfo);
        expect(argsObject.settings).eql({ key: 'settings' });
      });

      it('should call layoutComponents, when settings is implicit', () => {
        create().command.layoutComponents();
        expect(chart.layoutComponents).to.have.been.calledOnce;
      });

      it('should set correct binned data when calling layoutComponents', () => {
        dataHandler.getMeta.returns({ isBinnedData: true });
        create().command.layoutComponents({ settings: { key: 'settings' } });
        const argsObject = chart.layoutComponents.args[0][0];

        expect(chart.layoutComponents).to.have.been.calledOnce;
        expect(argsObject.data).to.be.an('array');
        expect(argsObject.data[1].key).to.equal('db');
        expect(argsObject.data[1].type).to.equal('matrix');
        expect(argsObject.data[1].data()).eql(dataPages);
        expect(argsObject.settings).eql({ key: 'settings' });
      });
    });

    describe('update', () => {
      it('should call update correctly', () => {
        create().command.update({ settings: { key: 'settings' } });
        const argsObject = chart.update.args[0][0];

        expect(chart.update).to.have.been.calledOnce;
        expect(argsObject.data).to.be.an('array');
        expect(argsObject.data[0].config.localeInfo).to.equal(localeInfo);
        expect(argsObject.settings).eql({ key: 'settings' });
      });

      it('should call update, when settings is implicit', () => {
        create().command.update();
        expect(chart.update).to.have.been.calledOnce;
      });

      it('should update correct binned data when calling update', () => {
        dataHandler.getMeta.returns({ isBinnedData: true });
        create().command.update({ settings: { key: 'settings' } });
        const argsObject = chart.update.args[0][0];

        expect(chart.update).to.have.been.calledOnce;
        expect(argsObject.data).to.be.an('array');
        expect(argsObject.data[1].key).to.equal('db');
        expect(argsObject.data[1].type).to.equal('matrix');
        expect(argsObject.data[1].data()).eql(dataPages);
        expect(argsObject.settings).eql({ key: 'settings' });
      });

      describe('getBinnedDataConfig', () => {
        describe('the returned object', () => {
          it('should have correct config.parse.fields function', () => {
            dataHandler.getMeta.returns({ isBinnedData: true });
            create().command.update();
            const binnedDataConfigObject = chart.update.args[0][0].data[1];
            expect(binnedDataConfigObject.config.parse.fields()).to.deep.equal([
              {
                key: 'fb',
                title: 'Bin',
              },
              {
                key: 'fbx',
                title: 'X',
              },
              {
                key: 'fby',
                title: 'Y',
              },
              {
                key: 'fbd',
                title: 'Density',
              },
            ]);
          });

          it('should have correct config.parse.row function', () => {
            dataHandler.getMeta.returns({ isBinnedData: true });
            create().command.update();
            const binnedDataConfigObject = chart.update.args[0][0].data[1];
            const d = { qElemNumber: 1, qText: [1, 2, 3, 4], qNum: 5 };
            expect(binnedDataConfigObject.config.parse.row(d)).to.deep.equal({
              bin: 1,
              binX: 2,
              binY: 3,
              binDensity: 5,
            });
          });
        });
      });
    });
  });

  describe('handle dataview update', () => {
    it('should not fetch data if interaction is in progress', () => {
      viewHandler.getInteractionInProgress.returns(true);
      dataHandler.fetch = sandbox.stub();
      create();
      viewState.dataView();
      expect(dataHandler.fetch).to.not.have.been.called;
    });

    describe('updatePartial', () => {
      it('should trigger chart.update properly (partial version), when not switching between binned and not binned data, and not toggling mini chart', async () => {
        sandbox.useFakeTimers();
        const { clock } = sandbox;
        chart.component.withArgs('mcp').returns(false);
        create();
        await viewState.dataView();
        await clock.tick(50);

        expect(chart.update).to.have.been.calledWithExactly({
          partialData: true,
          excludeFromUpdate: ['xat', 'yat', 'mcp'],
        });
      });
    });

    describe('update', () => {
      it('should trigger chart.update properly (full version), when mini chart is off then on, and on then off', async () => {
        sandbox.useFakeTimers();
        const { clock } = sandbox;
        dataHandler.getHomeStateBins.returns([{ qText: [0, 2, 1, 5] }]);
        viewHandler.getDataView.returns({ xAxisMin: -1, xAxisMax: 2, yAxisMin: 1, yAxisMax: 4 });
        createViewHandler.default.returns(viewHandler);
        create();
        // off --> on
        await viewState.dataView();
        await clock.tick(50);

        expect(chart.update).to.have.been.calledWithExactly({
          data: [
            {
              type: 'q',
              key: 'dm',
              data: {
                dataPages: [{ key: 'page-0' }, { key: 'page-1' }],
              },
              config: {
                localeInfo: { key: 'locale-info' },
              },
            },
            { colorData: 'oh yes' },
          ],
          settings: undefined,
        });

        // on --> off
        dataHandler.getHomeStateBins.returns([]);
        await viewState.dataView();
        await clock.tick(50);

        expect(chart.update).to.have.been.calledWithExactly({
          data: [
            {
              type: 'q',
              key: 'dm',
              data: {
                dataPages: [{ key: 'page-0' }, { key: 'page-1' }],
              },
              config: {
                localeInfo: { key: 'locale-info' },
              },
            },
            { colorData: 'oh yes' },
          ],
          settings: undefined,
        });
      });

      it('should trigger chart.update even if data fetching fails', async () => {
        sandbox.useFakeTimers();
        const { clock } = sandbox;
        dataHandler.fetch = sandbox.stub().rejects();
        dataHandler.getHomeStateBins.returns([]);
        create();

        await viewState.dataView();
        await clock.tick(50);

        expect(chart.update).to.have.been.called;
      });
    });
  });
});
