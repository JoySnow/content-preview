/* eslint-disable no-console */
import './_Details.scss';

import {
    Breadcrumb,
    BreadcrumbHeading,
    BreadcrumbItem,
    Card,
    CardBody,
    DataList,
    DataListCell,
    DataListItem,
    DataListItemCells,
    DataListItemRow,
    ExpandableSection,
    Flex,
    Form,
    FormGroup,
    Grid,
    GridItem,
    Label,
    LabelGroup,
    Page,
    PageSection,
    Split,
    SplitItem,
    Stack,
    StackItem,
    TextArea,
    Toolbar
} from '@patternfly/react-core';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components';
import { ReportDetails } from '@redhat-cloud-services/frontend-components-advisor-components/ReportDetails';
import React, { useEffect, useState } from 'react';
import { fetchContentDetails, fetchContentDetailsHits } from '../../store/Actions';

import API from '../../Utilities/Api';
import HostSelector from '../../PresentationalComponents/HostSelector/HostSelector';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

const Details = ({
    match,
    fetchContentDetails,
    details,
    fetchContentDetailsHits,
    contentDetailsHits
}) => {
    const [selectedListItem, setSelectedListItem] = useState(0);
    const capitalize = (string) => string[0].toUpperCase() + string.substring(1);
    const [expanded, setExpanded] = useState(true);
    const pyFilter = (data) => {
        const keysToInclude = Object.keys(data).filter(
            (key) => !key.includes('__')
        );
        const arrayObj = keysToInclude.map((key) => ({ [key]: data[key] }));

        return Object.assign({}, ...arrayObj);
    };

    const selectedPyData =
    selectedListItem >= 1 && pyFilter(contentDetailsHits[selectedListItem - 1]);
    const detailHref = `https://access.redhat.com/node/${details.node_id}`;
    const [freeStyle, setFreeStyle] = useState('');
    const [freeStyleValidated, setFreeStyleValidated] = useState('default');
    const [validFreeStyle, setValidFreeStyle] = useState('');
    const [helperText, setHelperText] = useState('Please enter valid JSON');
    const [kbaDetailsData, setLbaDetailsData] = useState({});
    const [kbaLoading, setKbaLoading] = useState(true);

    const freeStyleChange = (input) => {
        let isValid;
        const parser = (input) => {
            try {
                return JSON.parse(input);
            } catch (error) {
                return false;
            }
        };

        if (input.length > 0) {
            const validInput = parser(input);
            if (validInput) {
                isValid = 'success';
                setValidFreeStyle(validInput);
                setHelperText('Valid JSON! 🥰');
            } else {
                isValid = 'error';
                setValidFreeStyle('');
            }
        } else {
            isValid = 'default';
            setValidFreeStyle('');
            setHelperText('Please enter valid JSON');
        }

        setFreeStyleValidated(isValid);
        setFreeStyle(input);
    };

    const severityLabelColor = (severity) =>
        severity === 'ERROR'
            ? 'red'
            : severity === 'WARN'
                ? 'orange'
                : severity === 'INFO'
                    ? 'purple'
                    : 'blue';

    const fetchKbaDetails = async (kbaId) => {
        try {
            const kbaDetailsFetch = (
                await API.get(
                    `https://access.redhat.com/hydra/rest/search/kcs?q=id:(${kbaId})&fl=view_uri,id,publishedTitle&rows=1&redhat_client=$ADVISOR`,
                    {},
                    { credentials: 'include' }
                )
            ).data.response.docs;
            setLbaDetailsData(kbaDetailsFetch[0]);
            setKbaLoading(false);
        } catch (error) {
            console.error(error, 'KBA fetch failed.');
        }
    };

    const ruleDescription = (data, isGeneric) =>
        typeof data === 'string' &&
    Boolean(data) && (
            <span className={isGeneric && 'genericOverride'}>
                <Markdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>{data}</Markdown>
            </span>
        );

    useEffect(() => {
        const detailName = { name: match.params.recDetail };
        fetchContentDetails(detailName);
        fetchContentDetailsHits(detailName);
        fetchKbaDetails(details.node_id);
    }, [
        fetchContentDetails,
        match.params.recDetail,
        fetchContentDetailsHits,
        details.node_id
    ]);

    return (
        <Page
            breadcrumb={
                <Breadcrumb>
                    <BreadcrumbItem>
                        <Link to="/preview">Content Preview</Link>
                    </BreadcrumbItem>
                    <BreadcrumbHeading to="#">{`${match.params.recDetail}`}</BreadcrumbHeading>
                </Breadcrumb>
            }
        >
            <PageHeader>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <PageHeaderTitle
                        title={
                            <>
                                {details.rule_id || 'loading...'}{' '}
                                {details.status !== undefined && (
                                    <Label color={details.status === 'active' ? 'green' : 'red'}>
                                        {capitalize(details.status)}
                                    </Label>
                                )}{' '}
                            </>
                        }
                    />
                    <Toolbar>
                        <HostSelector />
                    </Toolbar>
                </Flex>
            </PageHeader>
            <PageSection>
                <Grid hasGutter>
                    <GridItem span={6}>
                        <Stack hasGutter>
                            <Card>
                                <CardBody>
                                    <ExpandableSection
                                        toggleText={details.description}
                                        onToggle={() => setExpanded(!expanded)}
                                        isExpanded={expanded}
                                    >
                                        <Stack hasGutter>
                                            <StackItem>
                                                <p>
                                                    {`Publish Date: ${details.publish_date} | `}
                                                    {details.node_id ? (
                                                        <a href={detailHref}>{detailHref}</a>
                                                    ) : (
                                                        <Label variant="outline" color="gray">
                                                            No node_id present
                                                        </Label>
                                                    )}
                                                </p>
                                                {(details.reboot_required ||
                                                    details.category ||
                                                    details.severity) && (
                                                    <LabelGroup>
                                                        {details.reboot_required && (
                                                            <Label variant="outline" color="gray">
                                                                Reboot required
                                                            </Label>
                                                        )}
                                                        {details.category && (
                                                            <Label variant="outline" color="gray">
                                                                {details.category}
                                                            </Label>
                                                        )}
                                                        {details.severity && (
                                                            <Label
                                                                variant="outline"
                                                                color={severityLabelColor(details.severity)}
                                                            >
                                                                {details.severity}
                                                            </Label>
                                                        )}
                                                    </LabelGroup>
                                                )}
                                            </StackItem>
                                            <StackItem>
                                                <Stack hasGutter>
                                                    <StackItem>
                                                        <strong>Name:</strong>
                                                        {ruleDescription(details.name)}
                                                    </StackItem>
                                                    {/* <StackItem>
                                                        <strong>Summary:</strong>
                                                        {ruleDescription(details.summary)}
                                                    </StackItem> */}
                                                    <StackItem>
                                                        <strong>Generic:</strong>
                                                        {ruleDescription(details.generic, true)}
                                                    </StackItem>
                                                </Stack>
                                            </StackItem>
                                            <StackItem>
                                                <Form>
                                                    <FormGroup
                                                        label="Free Style JSON input:"
                                                        type="string"
                                                        helperText={helperText}
                                                        helperTextInvalid="Not valid JSON"
                                                        fieldId="selection"
                                                        validated={freeStyleValidated}
                                                    >
                                                        <TextArea
                                                            value={freeStyle}
                                                            onChange={freeStyleChange}
                                                            isRequired
                                                            validated={freeStyleValidated}
                                                            aria-label="free style JSON input"
                                                        />
                                                    </FormGroup>
                                                </Form>
                                            </StackItem>
                                        </Stack>
                                    </ExpandableSection>
                                </CardBody>
                            </Card>
                            <DataList
                                className="pyDataList"
                                aria-label="selectable data list example"
                                selectedDataListItemId={selectedListItem}
                                onSelectDataListItem={(id) =>
                                    id !== selectedListItem
                                        ? setSelectedListItem(id)
                                        : setSelectedListItem(0)
                                }
                            >
                                {contentDetailsHits.map((item, key) => (
                                    <DataListItem
                                        aria-labelledby="selectable-action-item1"
                                        key={key + 1}
                                        id={key + 1}
                                    >
                                        <DataListItemRow className="overFlow">
                                            <DataListItemCells
                                                dataListCells={[
                                                    <DataListCell key="primary content">
                                                        <Split hasGutter>
                                                            <SplitItem>
                                                                <b>{item.__name}</b>
                                                            </SplitItem>
                                                            <SplitItem>
                                                                <Label color="blue">{item.__source}</Label>
                                                            </SplitItem>
                                                        </Split>
                                                        <h5>{item.__date}</h5>
                                                        <pre>{JSON.stringify(pyFilter(item), null, 2)}</pre>
                                                    </DataListCell>
                                                ]}
                                            />
                                        </DataListItemRow>
                                    </DataListItem>
                                ))}
                            </DataList>
                        </Stack>
                    </GridItem>
                    <GridItem span={6}>
                        <ReportDetails
                            report={{
                                ...details,
                                rule: details,
                                ...(selectedPyData && { details: selectedPyData }),
                                ...(validFreeStyle && { details: validFreeStyle }),
                                resolution: details.resolution
                            }}
                            kbaDetail={kbaDetailsData}
                            kbaLoading={kbaLoading}
                        />
                    </GridItem>
                </Grid>
            </PageSection>
        </Page>
    );
};

Details.displayName = 'view-rec-details';

Details.propTypes = {
    match: PropTypes.object,
    fetchContentDetails: PropTypes.func,
    details: PropTypes.object,
    contentDetailsFetchStatus: PropTypes.string,
    contentDetailsHits: PropTypes.array,
    fetchContentDetailsHits: PropTypes.func,
    contentDetailsHitsFetchStatus: PropTypes.string
};

const mapStateToProps = ({ CPStore }) => ({
    details: CPStore.contentDetails,
    detailsFetchStatus: CPStore.fetchContentStatus,
    contentDetailsHits: CPStore.contentDetailsHits,
    contentDetailsHitsFetchStatus: CPStore.contentDetailsHitsFetchStatus
});

const mapDispatchToProps = dispatch => ({
    fetchContentDetails: options => dispatch(fetchContentDetails(options)),
    fetchContentDetailsHits: options => dispatch(fetchContentDetailsHits(options))
});

export default withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
)(Details));
