/*
Copyright 2016 OpenMarket Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import Matrix from 'matrix-js-sdk';
const InteractiveAuth = Matrix.InteractiveAuth;

import React from 'react';

import sdk from '../../../index';

import {getEntryComponentForLoginType} from '../login/InteractiveAuthEntryComponents';

export default React.createClass({
    displayName: 'InteractiveAuthDialog',

    propTypes: {
        // response from initial request. If not supplied, will do a request on
        // mount.
        authData: React.PropTypes.shape({
            flows: React.PropTypes.array,
            params: React.PropTypes.object,
            session: React.PropTypes.string,
        }),

        // callback
        makeRequest: React.PropTypes.func.isRequired,

        onFinished: React.PropTypes.func.isRequired,

        title: React.PropTypes.string,
        submitButtonLabel: React.PropTypes.string,
    },

    getDefaultProps: function() {
        return {
            title: "Authentication",
            submitButtonLabel: "Submit",
        };
    },

    getInitialState: function() {
        return {
            authStage: null,
            busy: false,
            errorText: null,
            stageErrorText: null,
            submitButtonEnabled: false,
        };
    },

    componentWillMount: function() {
        this._unmounted = false;
        this._authLogic = new InteractiveAuth({
            authData: this.props.authData,
            doRequest: this._requestCallback,
            startAuthStage: this._startAuthStage,
        });

        this._authLogic.attemptAuth().then((result) => {
            this.props.onFinished(true, result);
        }).catch((error) => {
            console.error("Error during user-interactive auth:", error);
            if (this._unmounted) {
                return;
            }

            const msg = error.message || error.toString();
            this.setState({
                errorText: msg
            });
        }).done();
    },

    componentWillUnmount: function() {
        this._unmounted = true;
    },

    _startAuthStage: function(stageType, error) {
        this.setState({
            authStage: stageType,
            errorText: error ? error.error : null,
        }, this._setFocus);
    },

    _requestCallback: function(auth) {
        this.setState({
            busy: true,
            errorText: null,
            stageErrorText: null,
        });
        return this.props.makeRequest(auth).finally(() => {
            if (this._unmounted) {
                return;
            }
            this.setState({
                busy: false,
            });
        });
    },

    _onKeyDown: function(e) {
        if (e.keyCode === 27) { // escape
            e.stopPropagation();
            e.preventDefault();
            if (!this.state.busy) {
                this._onCancel();
            }
        }
        else if (e.keyCode === 13) { // enter
            e.stopPropagation();
            e.preventDefault();
            if (this.state.submitButtonEnabled && !this.state.busy) {
                this._onSubmit();
            }
        }
    },

    _onSubmit: function() {
        if (this.refs.stageComponent && this.refs.stageComponent.onSubmitClick) {
            this.refs.stageComponent.onSubmitClick();
        }
    },

    _setFocus: function() {
        if (this.refs.stageComponent && this.refs.stageComponent.focus) {
            this.refs.stageComponent.focus();
        }
    },

    _onCancel: function() {
        this.props.onFinished(false);
    },

    _setSubmitButtonEnabled: function(enabled) {
        this.setState({
            submitButtonEnabled: enabled,
        });
    },

    _submitAuthDict: function(authData) {
        this._authLogic.submitAuthDict(authData);
    },

    _renderCurrentStage: function() {
        const stage = this.state.authStage;
        var StageComponent = getEntryComponentForLoginType(stage);
        return (
            <StageComponent ref="stageComponent"
                loginType={stage}
                authSessionId={this._authLogic.getSessionId()}
                stageParams={this._authLogic.getStageParams(stage)}
                submitAuthDict={this._submitAuthDict}
                setSubmitButtonEnabled={this._setSubmitButtonEnabled}
                errorText={this.state.stageErrorText}
            />
        );
    },

    render: function() {
        const Loader = sdk.getComponent("elements.Spinner");

        let error = null;
        if (this.state.errorText) {
            error = (
                <div className="error">
                    {this.state.errorText}
                </div>
            );
        }

        const submitLabel = this.state.busy ? <Loader /> : this.props.submitButtonLabel;
        const submitEnabled = this.state.submitButtonEnabled && !this.state.busy;

        const submitButton = (
            <button className="mx_Dialog_primary"
                onClick={this._onSubmit}
                disabled={!submitEnabled}
            >
                {submitLabel}
            </button>
        );

        const cancelButton = (
            <button onClick={this._onCancel}>
                Cancel
            </button>
        );

        return (
            <div className="mx_InteractiveAuthDialog" onKeyDown={this._onKeyDown}>
                <div className="mx_Dialog_title">
                    {this.props.title}
                </div>
                <div className="mx_Dialog_content">
                    <p>This operation requires additional authentication.</p>
                    {this._renderCurrentStage()}
                    {error}
                </div>
                <div className="mx_Dialog_buttons">
                    {submitButton}
                    {cancelButton}
                </div>
            </div>
        );
    },
});
