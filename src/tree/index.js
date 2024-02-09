import InfiniteScroll from 'react-infinite-scroll-component'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

import TreeNode from '../tree-node'
import { findIndex } from '../utils'

class Tree extends Component {
  static propTypes = {
    data: PropTypes.object,
    keepTreeOnSearch: PropTypes.bool,
    keepChildrenOnSearch: PropTypes.bool,
    searchModeOn: PropTypes.bool,
    onChange: PropTypes.func,
    onNodeToggle: PropTypes.func,
    onAction: PropTypes.func,
    onCheckboxChange: PropTypes.func,
    mode: PropTypes.oneOf(['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical']),
    showPartiallySelected: PropTypes.bool,
    pageSize: PropTypes.number,
    readOnly: PropTypes.bool,
    clientId: PropTypes.string,
    activeDescendant: PropTypes.string,
  }

  static defaultProps = {
    pageSize: 100,
  }

  constructor(props) {
    super(props)

    this.currentPage = 1
    this.computeInstanceProps(props, true)

    this.state = {
      items: this.allVisibleNodes.slice(0, this.props.pageSize),
    }
  }

  propsChanged = (prevProps, nextProps) => {
    const allVisibleNodes = this.getNodes(this.props)
    if (allVisibleNodes.length !== this.allVisibleNodes.length) return true

    if (prevProps.data && nextProps.data) {
      if (JSON.stringify(prevProps.data) !== JSON.stringify(nextProps.data)) return true
    } else if (prevProps.data !== nextProps.data) return true

    if (prevProps.keepTreeOnSearch !== nextProps.keepTreeOnSearch) return true
    if (prevProps.keepChildrenOnSearch !== nextProps.keepChildrenOnSearch) return true
    if (prevProps.searchModeOn !== nextProps.searchModeOn) return true
    if (prevProps.mode !== nextProps.mode) return true
    if (prevProps.showPartiallySelected !== nextProps.showPartiallySelected) return true
    if (prevProps.readOnly !== nextProps.readOnly) return true
    if (prevProps.activeDescendant !== nextProps.activeDescendant) return true
    if (prevProps.clientId !== nextProps.clientId) return true
    if (prevProps.pageSize !== nextProps.pageSize) return true

    return false
  }

  componentDidUpdate(prevProps) {
    if (this.propsChanged(prevProps, this.props)) {
      console.log('componentDidUpdate props changed', prevProps, this.props)

      const { activeDescendant } = this.props
      const hasSameActiveDescendant = activeDescendant === this.props.activeDescendant
      this.computeInstanceProps(this.props, !hasSameActiveDescendant)
      this.setState({ items: this.allVisibleNodes.slice(0, this.currentPage * this.props.pageSize) })
    }
  }

  componentDidMount = () => {
    this.setState({ scrollableTarget: this.node.parentNode })
  }

  computeInstanceProps = (props, checkActiveDescendant) => {
    this.allVisibleNodes = this.getNodes(props)
    this.totalPages = Math.ceil(this.allVisibleNodes.length / this.props.pageSize)
    if (checkActiveDescendant && props.activeDescendant) {
      const currentId = props.activeDescendant.replace(/_li$/, '')
      let focusIndex = findIndex(this.allVisibleNodes, (n) => n.key === currentId) + 1
      this.currentPage = focusIndex > 0 ? Math.ceil(focusIndex / this.props.pageSize) : 1
    }
  }

  shouldRenderNode = (node, props) => {
    const { data, searchModeOn } = props
    const { expanded, _parent } = node
    if (searchModeOn || expanded) return true

    const parent = _parent && data.get(_parent)
    // if it has a parent, then check parent's state.
    // otherwise root nodes are always rendered
    return !parent || parent.expanded
  }

  getNodes = (props) => {
    const {
      data,
      keepTreeOnSearch,
      keepChildrenOnSearch,
      searchModeOn,
      mode,
      showPartiallySelected,
      readOnly,
      onAction,
      onChange,
      onCheckboxChange,
      onNodeToggle,
      activeDescendant,
      clientId,
    } = props
    const items = []
    data.forEach((node) => {
      if (this.shouldRenderNode(node, props)) {
        items.push(
          <TreeNode
            keepTreeOnSearch={keepTreeOnSearch}
            keepChildrenOnSearch={keepChildrenOnSearch}
            key={node._id}
            {...node}
            searchModeOn={searchModeOn}
            onChange={onChange}
            onCheckboxChange={onCheckboxChange}
            onNodeToggle={onNodeToggle}
            onAction={onAction}
            mode={mode}
            showPartiallySelected={showPartiallySelected}
            readOnly={readOnly}
            clientId={clientId}
            activeDescendant={activeDescendant}
          />
        )
      }
    })
    return items
  }

  hasMore = () => this.currentPage < this.totalPages

  loadMore = () => {
    this.currentPage = this.currentPage + 1
    const nextItems = this.allVisibleNodes.slice(0, this.currentPage * this.props.pageSize)
    this.setState({ items: nextItems })
  }

  setNodeRef = (node) => {
    this.node = node
  }

  getAriaAttributes = () => {
    const { mode } = this.props

    const attributes = {
      /* https://www.w3.org/TR/wai-aria-1.1/#select
       * https://www.w3.org/TR/wai-aria-1.1/#tree */
      role: mode === 'simpleSelect' ? 'listbox' : 'tree',
      'aria-multiselectable': /multiSelect|hierarchical/.test(mode),
    }

    return attributes
  }

  render() {
    const { searchModeOn } = this.props

    return (
      <ul className={`root ${searchModeOn ? 'searchModeOn' : ''}`} ref={this.setNodeRef} {...this.getAriaAttributes()}>
        {this.state.scrollableTarget && (
          <InfiniteScroll
            dataLength={this.state.items.length}
            next={this.loadMore}
            hasMore={this.hasMore()}
            loader={<span className="searchLoader">Loading...</span>}
            scrollableTarget={this.state.scrollableTarget}
          >
            {this.state.items}
          </InfiniteScroll>
        )}
      </ul>
    )
  }
}

export default Tree
