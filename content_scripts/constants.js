const IMPULS = 'Impulse IQ Backtester [Trading IQ]'
const REVERSAL = 'Reversal IQ Backtester [Trading IQ]'
const COUNTER_STRIKE = 'Counter Strike Backtester [Trading IQ]'
const NOVA = 'Nova IQ Backtester [Trading IQ]'
const RAZOR = 'Razor IQ Backtester [TradingIQ]'
const SUPPORTED_STRATEGIES = [IMPULS, REVERSAL, COUNTER_STRIKE, NOVA, RAZOR];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CURRENT_TF = 'CURRENT_TF';
const HEADER_SINGLE = ['buy & hold return', 'max equity run-up', 'max equity drawdown', 'sharpe ratio', 'sortino ratio', 'open p&l'];
const HEADER_PERCENT = ['net profit', 'gross profit', 'gross loss', 'max equity run-up', 'max equity drawdown', 'buy & hold return', 'open p&l', 'avg trade', 'avg winning trade', 'avg losing trade', 'largest winning trade', 'largest losing trade'];

const constants = {
    'impulsIq_optimize': 'Optimize',
    'impulsIq_rr_on_off': 'Use R Multiple (R:R)', //TODO
    'impulsIq_rr': 'Use R Multiple (R:R)',
    'impulsIq_slAndTd': 'Minimum Stop Loss And Trailing Target Distance',
    'impulsIq_strategyType': 'Strategy Type',
    'impulsIq_trade_long': 'Trade Long',
    'impulsIq_trade_short': 'Trade Short',

    'counterIq_use_ema_filter': 'Use EMA Length',
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

    'novaIq_min_atr_sl_tp': 'Minimum ATR Profit Target And Stop Loss',
    'novaIq_trade_long': 'Trade Long',
    'novaIq_trade_reversions': 'Trade Nova IQ Reversions',
    'novaIq_trade_short': 'Trade Short',
    'novaIq_trade_trends': 'Trade Nova IQ Trends',
    'novaIq_use_higher_rr': 'Use Higher RR',

    'reversalIq_optimize': 'Run Optimize',
    'reversalIq_ai_direction': 'AI Direction',
    'reversalIq_limit_order_at_entry': 'Place Limit Orders Immediately At Entry',
    'reversalIq_min_atr_sl_tp': 'Minimum ATR TP/SL',
    'reversalIq_not_trade_avg_vola': 'Do Not Trade Average Volatility',
    'reversalIq_not_trade_high_vola': 'Do Not Trade High Volatility',
    'reversalIq_not_trade_low_vola': 'Do Not Trade Low Volatility',
    'reversalIq_not_trade_very_high_vola': 'Do Not Trade Very High Volatility',
    'reversalIq_optimize_ai_agg': 'Optimization AI Aggressiveness',

    'razorIq_trade_long': 'Trade Long',
    'razorIq_trade_short': 'Trade Short',
    'razorIq_limit_order_sl': 'Limit Order Stop Loss (Longs Only)',
    'razorIq_slAndTp': 'Minimum ATR TP/SL - Shorts Only (Does Not Affect Longs)',

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