const IMPULS = 'Impulse IQ Backtester [Trading IQ]'
const REVERSAL = 'Reversal IQ Backtester [Trading IQ]'
const COUNTER_STRIKE = 'Counter Strike Backtester [Trading IQ]'
const NOVA = 'Nova IQ Backtester [Trading IQ]'
const RAZOR = 'Razor IQ Backtester [TradingIQ]'
const WICK_SLICER = 'Wick Slicer IQ Backtester [TradingIQ]'
const SUPPORTED_STRATEGIES = [IMPULS, REVERSAL, COUNTER_STRIKE, NOVA, RAZOR, WICK_SLICER];
const SHORT_INDIICATORS = ['IP', 'RV', 'CS', 'NV', 'RZ', 'WI'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CURRENT_TF = 'CURRENT_TF';
const HEADER_SINGLE = ['buy & hold return', 'max equity run-up', 'max equity drawdown', 'sharpe ratio', 'sortino ratio', 'open p&l'];
const HEADER_PERCENT = ['net profit', 'gross profit', 'gross loss', 'max equity run-up', 'max equity drawdown', 'buy & hold return', 'open p&l', 'avg trade', 'avg winning trade', 'avg losing trade', 'largest winning trade', 'largest losing trade'];
const TIMEFRAME_PROPERTIES = ['LTF Zig Zag', 'HTF Zig Zag'];

const NOVA_TREND_LONG_PF = 'IQ Long PF (Trend)'
const NOVA_TREND_SHORT_PF = 'IQ Short PF (Trend)'
const NOVA_REVERSION_LONG_PF = 'IQ Long PF (Reversion)'
const NOVA_REVERSION_SHORT_PF = 'IQ Short PF (Reversion)'
const LONG_PF = 'IQ Long PF'
const SHORT_PF = 'IQ Short PF'

const RANGE_FROM_CHART = 'Range from chart';
const LAST_7_DAYS = 'Last 7 days';
const LAST_30_DAYS = 'Last 30 days';
const LAST_90_DAYS = 'Last 90 days';
const LAST_365_DAYS = 'Last 365 days';
const ENTIRE_HISTORY = 'Entire history';
const CUSTOM_RANGE = 'Custom date range…';

const STATUS_MSG = `
Do not change/move/resize the window/tab.<br>
If the Tradingview page is not in the foreground, the extension will not work.<br>


`;

const constants = {
    'impulsIq_optimize': 'Optimize',
    'impulsIq_rr_on_off': 'Use R Multiple (R:R)',
    'impulsIq_rr': 'Use R Multiple (R:R)',
    'impulsIq_slAndTd': 'Minimum Stop Loss And Trailing Target Distance',
    'impulsIq_strategyType': 'Strategy Type',
    'impulsIq_trade_long': 'Trade Long',
    'impulsIq_trade_short': 'Trade Short',
    'impulsIq_ltf': 'LTF Zig Zag',
    'impulsIq_htf': 'HTF Zig Zag',
    'impulsIq_risk_per_trade_on_off': 'Risk % of Total Account per Trade',
    'impulsIq_risk_per_trade': 'Risk % of Total Account per Trade',
    'impulsIq_calc_bars': 'Calculated bars',

    'counterIq_use_ema_filter': 'Use EMA Filter',
    'counterIq_ema_length': 'EMA Length',
    'counterIq_min_atr_profit': 'Minimum ATR Profit',
    'counterIq_min_atr_stop': 'Minimum ATR Stop',
    'counterIq_optimize': 'Optimize',
    'counterIq_sl_learning_type': 'Stop Loss Learning Type',
    'counterIq_stop_type_long': 'Stop Type Long',
    'counterIq_stop_type_short': 'Stop Type Short',
    'counterIq_trade_long': 'Trade Long',
    'counterIq_trade_short': 'Trade Short',
    'counterIq_not_trade_avg_vola': 'Do Not Trade Average Volatility',
    'counterIq_not_trade_high_vola': 'Do Not Trade High Volatility',
    'counterIq_not_trade_low_vola': 'Do Not Trade Low Volatility',
    'counterIq_not_trade_very_high_vola': 'Do Not Trade Very High Volatility',
    'counterIq_risk_per_trade_on_off': 'Risk % of Total Account per Trade',
    'counterIq_risk_per_trade': 'Risk % of Total Account per Trade',
    'counterIq_calc_bars': 'Calculated bars',

    'novaIq_min_atr_profit': 'Minimum ATR Profit Target',
    'novaIq_min_atr_stop': 'Minimum ATR Stop Loss',
    'novaIq_trade_long': 'Trade Long',
    'novaIq_trade_short': 'Trade Short',
    'novaIq_trade_reversions': 'Trade Nova IQ Reversions',
    'novaIq_trade_trends': 'Trade Nova IQ Trends',
    'novaIq_use_higher_rr': 'Use Higher RR',
    'novaIq_risk_per_trade_on_off': 'Risk % of Total Account per Trade',
    'novaIq_risk_per_trade': 'Risk % of Total Account per Trade',
    'novaIq_calc_bars': 'Calculated bars',

    'reversalIq_optimize': 'Run Optimize',
    'reversalIq_ai_direction': 'AI Direction',
    'reversalIq_limit_order_at_entry': 'Place Limit Orders Immediately At Entry',
    'reversalIq_min_atr_profit': 'Minimum ATR TP',
    'reversalIq_min_atr_stop': 'Minimum ATR SL',
    'reversalIq_not_trade_avg_vola': 'Do Not Trade Average Volatility',
    'reversalIq_not_trade_high_vola': 'Do Not Trade High Volatility',
    'reversalIq_not_trade_low_vola': 'Do Not Trade Low Volatility',
    'reversalIq_not_trade_very_high_vola': 'Do Not Trade Very High Volatility',
    'reversalIq_optimize_ai_agg': 'Optimization AI Aggressiveness',
    'reversalIq_calculated_bars': 'Calculated bars',
    'reversalIq_risk_per_trade_on_off': 'Risk % of Total Account per Trade',
    'reversalIq_risk_per_trade': 'Risk % of Total Account per Trade',
    'reversalIq_calc_bars': 'Calculated bars',

    'razorIq_trade_long': 'Trade Long',
    'razorIq_trade_short': 'Trade Short',
    'razorIq_limit_order_sl': 'Limit Order Stop Loss (Longs Only)',
    'razorIq_slAndTp': 'Minimum ATR TP/SL - Shorts Only (Does Not Affect Longs)',

    'wickSlicerIq_aggressive_ai': 'Aggressive AI',
    'wickSlicerIq_trade_long': 'Trade Longs',
    'wickSlicerIq_trade_short': 'Trade Shorts',
    'wickSlicerIq_dont_trade_opening_candle': 'Don\'t Trade Opening Candle',

    'sp_ordersize_type': 'Order size type', //TODO
    'sp_after_order_is_filled': 'After order is filled',
    'sp_commission': 'Commission',
    'sp_commission_type': 'Commission type', //TODO
    'sp_initial_capital': 'Initial capital',
    'sp_marging_long': 'Margin for long positions',
    'sp_marging_short': 'Margin for short positions',
    'sp_on_bar_close': 'On bar close',
    'sp_on_every_tick': 'On every tick',
    'sp_ordersize': 'Order size',
    'sp_price_limit_orders': 'Verify price for limit orders',
    'sp_pyramiding': 'Pyramiding',
    'sp_slippage': 'Slippage',
    'sp_using_bar_magnifier': 'Using bar magnifier',
    'sp_using_standard_ohlc': 'Using standard OHLC',
    'strategy_properties_base_currency': 'Base currency',
}