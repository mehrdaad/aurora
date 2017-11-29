import React from "react";
import styled from "styled-components";
import theme from "../theme/base";
import { X } from "react-feather";

const TagViewContainer = styled.div`
  display: inline-block;
  background: ${props => props.theme.colors.lightPrimary};
  text-transform: lowercase;
  border-radius: ${props => props.theme.borderRadius};
  padding: ${props => props.theme.spacing.lessPadding};
  margin: ${props => props.theme.spacing.lessPadding};
`;

const Icon = styled.div`
  height: 100%;
  line-height: ${props => props.theme.iconSizes.small};
  display: inline-block;
  vertical-align: bottom;
  padding: 1px 2px 0px 2px;
  cursor: pointer;
  border-radius: 100px;
  margin-left: ${props => props.theme.spacing.padding};

  &:hover {
    background: ${props => props.theme.colors.primary};

    & > svg {
      stroke: white;
    }
  }
`;

export default props => (
  <TagViewContainer key={`${props.key}-container`}>
    {props.text}
    <Icon onClick={props.onDelete}>
      <X size={theme.iconSizes.small} />
    </Icon>
  </TagViewContainer>
);
