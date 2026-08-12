<?php
/**
 * Sample block template.
 *
 * ACF supplies the editor preview wrapper. The template adds the matching
 * frontend wrapper so WordPress block supports are applied once in each view.
 *
 * @package Baseline
 */

defined( 'ABSPATH' ) || exit;

$is_preview         = ! empty( $args['is_preview'] );
$wrapper_attributes = isset( $args['wrapper_attributes'] ) && is_string( $args['wrapper_attributes'] )
	? $args['wrapper_attributes']
	: '';
?>
<?php if ( ! $is_preview ) : ?>
	<?php // phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	<div <?php echo $wrapper_attributes; ?>>
	<?php // phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped ?>
<?php endif; ?>
	<InnerBlocks />
<?php if ( ! $is_preview ) : ?>
	</div>
<?php endif; ?>
