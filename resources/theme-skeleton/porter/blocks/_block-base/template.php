<?php
/**
 * Dummy_Title Template
 * 
 **/
extract( $args ); ?>
<div <?php echo $anchor; ?> <?php echo $class; ?>>
	<?php // Inner Blocks
	$allowed_blocks = [];
    $template = [];
    $allowed_blocks_attr 	= !empty( $allowed_blocks) ? 'allowedBlocks="'.esc_attr( wp_json_encode( $allowed_blocks ) ).'"' : '';
    $template_attr 			= !empty( $template) ? 'template="'.esc_attr( wp_json_encode( $template ) ).'"' : '';
	echo '<InnerBlocks class="inner-content" '.$allowed_blocks_attr.' '.$template_attr.' templateLock=false />'; ?>	
</div>