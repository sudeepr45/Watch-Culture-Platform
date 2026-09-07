import type { InteractiveWidgetType } from '../../types/watch101'
import AutomaticVsQuartzWidget from './AutomaticVsQuartzWidget'
import WaterResistanceWidget from './WaterResistanceWidget'
import CaseSizeWidget from './CaseSizeWidget'
import GmtWidget from './GmtWidget'
import ChronographWidget from './ChronographWidget'
import PowerReserveWidget from './PowerReserveWidget'

interface InteractiveTopicWidgetProps {
  type: InteractiveWidgetType
}

export default function InteractiveTopicWidget({ type }: InteractiveTopicWidgetProps) {
  switch (type) {
    case 'automatic-vs-quartz':
      return <AutomaticVsQuartzWidget />
    case 'water-resistance':
      return <WaterResistanceWidget />
    case 'case-size':
      return <CaseSizeWidget />
    case 'gmt':
      return <GmtWidget />
    case 'chronograph':
      return <ChronographWidget />
    case 'power-reserve':
      return <PowerReserveWidget />
    default:
      return null
  }
}
