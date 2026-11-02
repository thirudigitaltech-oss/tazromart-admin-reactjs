import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // Also log to console for debugging
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught error', error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div style={{ padding: 24 }}>
          <h1>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: 'red' }}>{String(error && error.toString())}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
