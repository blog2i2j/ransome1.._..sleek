import React, { useState, memo, useMemo } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Badge from '@mui/material/Badge'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TomatoIconDuo from '../tomato-duo.svg?asset'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import AirIcon from '@mui/icons-material/Air'
import { handleFilterSelect, friendlyDate, translatedAttributes } from '../Shared'
import { withTranslation, WithTranslation } from 'react-i18next'
import { i18n } from '../Settings/LanguageSelector'
import './Attributes.scss'

const { store } = window.api

interface DrawerAttributesComponentProps extends WithTranslation {
  settings: Settings
  attributes: Attributes | null
  filters: Filters | null
  t: typeof i18n.t
}

const DrawerAttributesComponent: React.FC<DrawerAttributesComponentProps> = memo(
  ({ settings, attributes, filters, t }) => {
    const [hovered, setHovered] = useState<string | null>(null)
    const isAttributesEmpty = useMemo(
      () =>
        !attributes ||
        Object.values(attributes).every((attribute) => !Object.keys(attribute).length),
      [attributes]
    )

    const preprocessAttributes = (
      attributeKey: string,
      attributes: Record<string, { count: number; notify: boolean }>
    ): Record<
      string,
      { key: string; name: string; count: number; notify: boolean; aggregatedValues: string[] }
    > | null => {
      if (!attributes) {
        return null
      }
      const isDate = ['due', 't', 'completed', 'created'].includes(attributeKey)
      const processedAttributes: Record<
        string,
        { key: string; name: string; count: number; notify: boolean; aggregatedValues: string[] }
      > = {}

      Object.keys(attributes).forEach((key) => {
        if (attributes[key]) {
          const count = attributes[key].count
          const formattedValues =
            settings.useHumanFriendlyDates && isDate
              ? friendlyDate(key, attributeKey, settings, t)
              : [key]

          formattedValues.forEach((formattedValue) => {
            if (!processedAttributes[formattedValue]) {
              processedAttributes[formattedValue] = {
                key: attributeKey,
                name: formattedValue,
                count,
                notify: attributes[key].notify,
                aggregatedValues: [key]
              }
            } else {
              processedAttributes[formattedValue].count += count
              processedAttributes[formattedValue].notify =
                processedAttributes[formattedValue].notify || attributes[key].notify
              processedAttributes[formattedValue].aggregatedValues.push(key)
            }
          })
        }
      })
      const sorting = [
        t('drawer.attributes.overdue'),
        t('drawer.attributes.elapsed'),
        t('drawer.attributes.lastWeek'),
        t('drawer.attributes.yesterday'),
        t('drawer.attributes.today'),
        t('drawer.attributes.tomorrow'),
        t('drawer.attributes.thisWeek'),
        t('drawer.attributes.nextWeek'),
        t('drawer.attributes.thisMonth'),
        t('drawer.attributes.nextMonth')
      ]
      const sortedAttributes = Object.fromEntries(
        Object.entries(processedAttributes).sort((a: unknown, b: unknown) => {
          const indexA = sorting.indexOf(a.name)
          const indexB = sorting.indexOf(b.name)
          return (
            (indexA !== -1 ? indexA : Number.MAX_SAFE_INTEGER) -
            (indexB !== -1 ? indexB : Number.MAX_SAFE_INTEGER)
          )
        })
      )
      return sortedAttributes
    }

    const handleAccordionToggle = (index: number): void => {
      const updatedAccordionOpenState = settings.accordionOpenState
      updatedAccordionOpenState[index] = !updatedAccordionOpenState[index]
      store.setConfig('accordionOpenState', updatedAccordionOpenState)
    }

    const renderAttributes = (
      preprocessedAttributes: Record<
        string,
        { key: string; name: string; count: number; notify: boolean; aggregatedValues: string[] }
      >,
      filters: Filters | null,
      handleFilterSelect: HandleFilterSelectType
    ): JSX.Element[] => {
      return Object.keys(preprocessedAttributes).map((value, childIndex) => {
        const attribute = preprocessedAttributes[value]
        const name = attribute.name
        const key = attribute.key
        const excluded =
          filters && filters[key]?.some((filter: Filter) => filter.name === name && filter.exclude)
        const selected = filters && filters[key]?.some((filter: Filter) => filter.name === name)
        const disabled = attribute.count === 0
        const notify = key === 'due' ? attribute.notify : false

        return (
          <div
            key={`${key}-${value}-${childIndex}`}
            data-todotxt-attribute={key}
            data-todotxt-value={value}
            onMouseEnter={() => setHovered(`${key}-${value}-${childIndex}`)}
            onMouseLeave={() => setHovered(null)}
            className={`filter ${selected ? 'selected' : ''} ${excluded ? 'excluded' : ''}`}
          >
            <Badge
              badgeContent={
                !disabled && attribute.count > 0 ? (
                  <span
                    onClick={(event) => {
                      event.stopPropagation()
                      handleFilterSelect(key, name, attribute.aggregatedValues, filters, true)
                    }}
                  >
                    {hovered === `${key}-${value}-${childIndex}` ? (
                      <VisibilityOffIcon />
                    ) : (
                      attribute.count
                    )}
                  </span>
                ) : null
              }
              className={notify ? 'notify' : null}
            >
              <button
                data-testid={`drawer-button-${key}`}
                onClick={
                  disabled
                    ? undefined
                    : (): void =>
                        handleFilterSelect(key, name, attribute.aggregatedValues, filters, false)
                }
                disabled={disabled}
                className={key === 'pm' ? 'pomodoro' : undefined}
              >
                {key === 'pm' && <img src={TomatoIconDuo} alt="Pomodoro" />}
                {value}
              </button>
            </Badge>
            {excluded && (
              <div
                data-todotxt-attribute={key}
                data-todotxt-value={value}
                data-testid={`drawer-button-exclude-${key}`}
                className="overlay"
                onClick={() =>
                  handleFilterSelect(key, name, attribute.aggregatedValues, filters, false)
                }
              >
                <VisibilityOffIcon />
              </div>
            )}
          </div>
        )
      })
    }

    return (
      <div id="Attributes">
        {!isAttributesEmpty ? (
          Object.keys(attributes).map((key, index) => {
            const preprocessedAttributes: Attributes = preprocessAttributes(key, attributes[key])
            const attributeHeadline: string = translatedAttributes(t)[key]

            return Object.keys(preprocessedAttributes).length > 0 ? (
              <Accordion
                key={index}
                expanded={settings.accordionOpenState[index]}
                onChange={() => handleAccordionToggle(index)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Badge
                    variant="dot"
                    invisible={
                      !(
                        key === 'due' &&
                        Object.values(preprocessedAttributes).some((attribute) => attribute.notify)
                      )
                    }
                    data-testid={`drawer-attributes-accordion-${key}`}
                  >
                    {attributeHeadline}
                  </Badge>
                </AccordionSummary>
                <AccordionDetails>
                  {renderAttributes(preprocessedAttributes, filters, handleFilterSelect)}
                </AccordionDetails>
              </Accordion>
            ) : null
          })
        ) : (
          <div className="placeholder">
            <AirIcon />
            <br />
            {t(`drawer.attributes.noAttributesAvailable`)}
          </div>
        )}
      </div>
    )
  }
)

DrawerAttributesComponent.displayName = 'DrawerAttributesComponent'

export default withTranslation()(DrawerAttributesComponent)
