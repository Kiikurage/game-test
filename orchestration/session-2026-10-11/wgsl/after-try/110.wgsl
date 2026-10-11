// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform4_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform4 : texture_3d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform15_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform15 : texture_2d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform28_sampler : sampler_comparison;
@binding( 6 ) @group( 1 ) var nodeUniform28 : texture_depth_2d;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform21 : vec3<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform34 : f32,
	nodeUniform35 : f32,
	nodeUniform19 : vec3<f32>,
	nodeUniform20 : vec3<f32>,
	nodeUniform22 : vec3<f32>,
	nodeUniform23 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform25 : mat4x4<f32>,
	nodeUniform26 : f32,
	nodeUniform27 : f32,
	nodeUniform31 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform29 : f32,
	nodeUniform30 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

struct objectStruct {
	nodeUniform1 : mat3x3<f32>,
	nodeUniform3 : f32,
	nodeUniform5 : mat4x4<f32>,
	nodeUniform6 : f32,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform9 : f32,
	nodeUniform10 : vec3<f32>,
	nodeUniform12 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform14 : f32,
	nodeUniform36 : vec3<f32>,
	nodeUniform37 : vec3<f32>,
	nodeUniform38 : vec3<f32>,
	nodeUniform39 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> normalViewGeometry : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : vec3<f32>;
var<private> nodeVar6 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> nodeVar7 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar8 : vec3<f32>;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : f32;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : vec3<f32>;
var<private> nodeVar14 : vec3<f32>;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : vec2<f32>;
var<private> nodeVar20 : f32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : vec3<f32>;
var<private> nodeVar25 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : vec3<f32>;
var<private> nodeVar30 : vec3<f32>;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : vec4<f32>;
var<private> nodeVar33 : vec4<f32>;
var<private> nodeVar34 : vec3<f32>;
var<private> nodeVar35 : vec3<f32>;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : vec3<f32>;
var<private> nodeVar38 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar39 : vec3<f32>;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : vec3<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> nodeVar52 : f32;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec4<f32>;
var<private> nodeVar61 : vec4<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : vec4<f32>;
var<private> nodeVar67 : vec3<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : f32;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : vec2<f32>;
var<private> nodeVar72 : f32;
var<private> nodeVar73 : vec2<f32>;
var<private> nodeVar74 : f32;
var<private> nodeVar75 : vec2<f32>;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : vec2<f32>;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : vec2<f32>;
var<private> nodeVar80 : f32;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : f32;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : vec3<f32>;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : f32;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : vec3<f32>;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : f32;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : f32;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : f32;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : f32;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : vec3<f32>;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar161 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : f32;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : f32;
var<private> nodeVar172 : f32;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : f32;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : f32;
var<private> nodeVar190 : f32;
var<private> nodeVar191 : f32;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar213 : vec3<f32>;
var<private> nodeVar214 : f32;
var<private> nodeVar215 : f32;
var<private> nodeVar216 : f32;
var<private> nodeVar217 : f32;
var<private> nodeVar218 : f32;
var<private> nodeVar219 : f32;
var<private> nodeVar220 : f32;
var<private> nodeVar221 : f32;
var<private> nodeVar222 : f32;
var<private> nodeVar223 : f32;
var<private> nodeVar224 : f32;
var<private> nodeVar225 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : vec4<f32>;

// codes
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) positionLocal : vec3<f32>,
	@location( 2 ) v_positionWorld : vec3<f32>,
	@location( 3 ) v_normalViewGeometry : vec3<f32>,
	@location( 4 ) v_positionViewDirection : vec3<f32>,
	@location( 5 ) nodeVarying7 : vec4<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	normalViewGeometry = normalize( v_normalViewGeometry );
	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar0 = mix( -0.11, 1.01, object.nodeUniform3 );
	nodeVar1 = textureSample( nodeUniform4, nodeUniform4_sampler, ( ( v_positionWorld * vec3<f32>( 4.2 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar2 = clamp( ( ( nodeVar1 * 0.9 ) + 0.5 ), 0.0, 1.0 );
	nodeVar3 = ( 1.0 - smoothstep( nodeVar0, ( nodeVar0 + 0.1 ), nodeVar2 ) );
	nodeVar4 = ( nodeVar3 * nodeVar3 );
	nodeVar5 = mix( ( ( mix( mix( nodeVarying7.xyz, ( ( vec3<f32>( dot( nodeVarying7.xyz, vec3<f32>( 0.2126, 0.7152, 0.0722 ) ) ) * vec3<f32>( 0.9, 1.0, 1.16 ) ) * vec3<f32>( 1.35 ) ), 0.0 ), ( vec3<f32>( 0.19461783043107173, 0.06847816983662762, 0.023153366173251363 ) * vec3<f32>( 0.35 ) ), 0.08 ) * vec3<f32>( 1.25 ) ) + ( vec3<f32>( 0.5, 0.48, 0.45 ) * vec3<f32>( ( smoothstep( 0.55, 1.0, normalWorld.y ) * 0.0 ) ) ) ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar4 * 0.9 ) );
	DiffuseColor = vec4<f32>( nodeVar5, 1.0 );

	if ( ( nodeVar2 > nodeVar0 ) ) {

		nodeVar6 = 1.0;

	} else {

		nodeVar6 = 0.0;

	}

	DiffuseColor.w = ( DiffuseColor.w * nodeVar6 );

	if ( ( DiffuseColor.w <= object.nodeUniform6 ) ) {

		discard;
		

	}

	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform7;
	nodeVar7 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform8, 0.0525 ) + max( max( nodeVar7.x, nodeVar7.y ), nodeVar7.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform7 ) ) );
	nodeVar8 = ( positionLocal * vec3<f32>( 5.5 ) );
	nodeVar9 = textureSample( nodeUniform4, nodeUniform4_sampler, ( nodeVar8 / vec3<f32>( 8.0 ) ) ).x;
	nodeVar10 = textureSample( nodeUniform4, nodeUniform4_sampler, ( ( ( nodeVar8 * vec3<f32>( 0.23 ) ) + vec3<f32>( 7.3 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar11 = textureSample( nodeUniform4, nodeUniform4_sampler, ( ( ( positionLocal * vec3<f32>( 13.2 ) ) + vec3<f32>( 3.7 ) ) / vec3<f32>( 8.0 ) ) ).x;

	if ( ( object.nodeUniform3 > 0.0 ) ) {

		nodeVar12 = 3.2;

	} else {

		nodeVar12 = 0.0;

	}

	nodeVar13 = normalize( normalWorld );
	nodeVar14 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar15 = pow( ( 1.0 - clamp( dot( nodeVar13, nodeVar14 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar16 = smoothstep( -0.35, 0.55, dot( nodeVar13, object.nodeUniform12 ) );
	nodeVar17 = smoothstep( -0.15, 0.85, ( - dot( nodeVar14, object.nodeUniform12 ) ) );
	EmissiveColor = ( ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform9 ) ) * vec3<f32>( ( ( ( ( ( 1.0 - smoothstep( 0.0, 0.032, abs( nodeVar9 ) ) ) * smoothstep( 0.05, 0.5, nodeVar10 ) ) * 1.1 ) + 0.0 ) + ( ( 1.0 - smoothstep( -0.25, 0.35, nodeVar11 ) ) * 0.03 ) ) ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar3 ) ) ) * vec3<f32>( nodeVar12 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform10 * vec3<f32>( nodeVar15 ) ) * vec3<f32>( nodeVar16 ) ) * vec3<f32>( ( ( nodeVar17 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform13 * vec3<f32>( nodeVar15 ) ) * vec3<f32>( ( 1.0 - ( nodeVar16 * nodeVar17 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar5 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar5, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform14 ) * vec3<f32>( ( 1.0 - nodeVar4 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar18 = dot( normalView, positionViewDirection );
	nodeVar19 = textureSample( nodeUniform15, nodeUniform15_sampler, vec2<f32>( Roughness, clamp( nodeVar18, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar19;
	nodeVar20 = ( dfg.x + dfg.y );
	nodeVar21 = ( 1.0 / nodeVar20 );
	nodeVar22 = nodeVar21;
	nodeVar23 = ( nodeVar22 - 1.0 );
	nodeVar24 = ( SpecularColorBlended * vec3<f32>( nodeVar23 ) );
	nodeVar25 = ( nodeVar24 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar25;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar26 = dot( normalWorld, normalize( render.nodeUniform18 ) );
	nodeVar27 = ( nodeVar26 * 0.5 );
	nodeVar28 = ( nodeVar27 + 0.5 );
	nodeVar29 = mix( render.nodeUniform16, render.nodeUniform17, nodeVar28 );
	nodeVar30 = ( irradiance + nodeVar29 );
	irradiance = nodeVar30;
	nodeVar31 = ( render.nodeUniform19 - render.nodeUniform20 );
	nodeVar32 = vec4<f32>( nodeVar31, 0.0 );
	nodeVar33 = ( render.cameraViewMatrix * nodeVar32 );
	nodeVar34 = normalize( nodeVar33.xyz );
	nodeVar35 = nodeVar34;
	nodeVar36 = dot( normalView, nodeVar35 );
	nodeVar37 = ( vec3<f32>( clamp( nodeVar36, 0.0, 1.0 ) ) * render.nodeUniform21 );
	nodeVar38 = nodeVar37;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar39 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar40 = ( nodeVar38 * nodeVar39 );
	nodeVar41 = ( nodeVar35 + positionViewDirection );
	nodeVar42 = normalize( nodeVar41 );
	nodeVar43 = dot( positionViewDirection, nodeVar42 );
	nodeVar44 = clamp( nodeVar43, 0.0, 1.0 );
	nodeVar45 = exp2( ( ( ( nodeVar44 * -5.55473 ) - 6.98316 ) * nodeVar44 ) );
	nodeVar46 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar45 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar45 ) ) );
	nodeVar47 = ( vec3<f32>( 1.0 ) - nodeVar46 );
	nodeVar48 = nodeVar47;
	nodeVar49 = ( nodeVar40 * nodeVar48 );
	nodeVar50 = ( directDiffuse + nodeVar49 );
	directDiffuse = nodeVar50;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar51 = normalize( ( nodeVar35 + positionViewDirection ) );
	nodeVar52 = clamp( dot( positionViewDirection, nodeVar51 ), 0.0, 1.0 );
	nodeVar53 = exp2( ( ( ( nodeVar52 * -5.55473 ) - 6.98316 ) * nodeVar52 ) );
	nodeVar54 = ( Roughness * Roughness );
	nodeVar55 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar53 ) ) ) + vec3<f32>( ( 1.0 * nodeVar53 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar54, clamp( dot( normalView, nodeVar35 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar54, clamp( dot( normalView, nodeVar51 ), 0.0, 1.0 ) ) ) );
	nodeVar56 = ( nodeVar38 * nodeVar55 );
	nodeVar57 = ( nodeVar56 * multiScatteringCompensation );
	nodeVar58 = ( directSpecular + nodeVar57 );
	directSpecular = nodeVar58;
	nodeVar59 = ( render.nodeUniform22 - render.nodeUniform23 );
	nodeVar60 = vec4<f32>( nodeVar59, 0.0 );
	nodeVar61 = ( render.cameraViewMatrix * nodeVar60 );
	nodeVar62 = normalize( nodeVar61.xyz );
	nodeVar63 = nodeVar62;
	nodeVar64 = dot( normalView, nodeVar63 );
	shadowPositionWorld = v_positionWorld;
	nodeVar66 = ( render.nodeUniform25 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform26 ) ) ), 1.0 ) );
	nodeVar67 = ( nodeVar66.xyz / vec3<f32>( nodeVar66.w ) );
	nodeVar68 = vec3<f32>( nodeVar67.x, ( 1.0 - nodeVar67.y ), ( nodeVar67.z + render.nodeUniform27 ) );

	if ( ( ( ( ( ( nodeVar68.x >= 0.0 ) && ( nodeVar68.x <= 1.0 ) ) && ( nodeVar68.y >= 0.0 ) ) && ( nodeVar68.y <= 1.0 ) ) && ( nodeVar68.z <= 1.0 ) ) ) {

		nodeVar69 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar70 = ( render.nodeUniform29 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform30 ).x );
		nodeVar71 = ( nodeVar68.xy + ( vogelDiskSample( 0, 5, nodeVar69 ) * vec2<f32>( nodeVar70 ) ) );
		nodeVar72 = textureSampleCompare( nodeUniform28, nodeUniform28_sampler, nodeVar71, nodeVar68.z );
		nodeVar73 = ( nodeVar68.xy + ( vogelDiskSample( 1, 5, nodeVar69 ) * vec2<f32>( nodeVar70 ) ) );
		nodeVar74 = textureSampleCompare( nodeUniform28, nodeUniform28_sampler, nodeVar73, nodeVar68.z );
		nodeVar75 = ( nodeVar68.xy + ( vogelDiskSample( 2, 5, nodeVar69 ) * vec2<f32>( nodeVar70 ) ) );
		nodeVar76 = textureSampleCompare( nodeUniform28, nodeUniform28_sampler, nodeVar75, nodeVar68.z );
		nodeVar77 = ( nodeVar68.xy + ( vogelDiskSample( 3, 5, nodeVar69 ) * vec2<f32>( nodeVar70 ) ) );
		nodeVar78 = textureSampleCompare( nodeUniform28, nodeUniform28_sampler, nodeVar77, nodeVar68.z );
		nodeVar79 = ( nodeVar68.xy + ( vogelDiskSample( 4, 5, nodeVar69 ) * vec2<f32>( nodeVar70 ) ) );
		nodeVar80 = textureSampleCompare( nodeUniform28, nodeUniform28_sampler, nodeVar79, nodeVar68.z );
		nodeVar65 = ( ( ( ( ( nodeVar72 + nodeVar74 ) + nodeVar76 ) + nodeVar78 ) + nodeVar80 ) * 0.2 );

	} else {

		nodeVar65 = 1.0;

	}

	nodeVar81 = mix( 1.0, nodeVar65, render.nodeUniform31 );
	nodeVar82 = ( vec3<f32>( clamp( nodeVar64, 0.0, 1.0 ) ) * ( render.nodeUniform24 * vec3<f32>( nodeVar81 ) ) );
	nodeVar83 = nodeVar82;
	nodeVar84 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar85 = ( nodeVar83 * nodeVar84 );
	nodeVar86 = ( nodeVar63 + positionViewDirection );
	nodeVar87 = normalize( nodeVar86 );
	nodeVar88 = dot( positionViewDirection, nodeVar87 );
	nodeVar89 = clamp( nodeVar88, 0.0, 1.0 );
	nodeVar90 = exp2( ( ( ( nodeVar89 * -5.55473 ) - 6.98316 ) * nodeVar89 ) );
	nodeVar91 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar90 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar90 ) ) );
	nodeVar92 = ( vec3<f32>( 1.0 ) - nodeVar91 );
	nodeVar93 = nodeVar92;
	nodeVar94 = ( nodeVar85 * nodeVar93 );
	nodeVar95 = ( directDiffuse + nodeVar94 );
	directDiffuse = nodeVar95;
	nodeVar96 = normalize( ( nodeVar63 + positionViewDirection ) );
	nodeVar97 = clamp( dot( positionViewDirection, nodeVar96 ), 0.0, 1.0 );
	nodeVar98 = exp2( ( ( ( nodeVar97 * -5.55473 ) - 6.98316 ) * nodeVar97 ) );
	nodeVar99 = ( Roughness * Roughness );
	nodeVar100 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar98 ) ) ) + vec3<f32>( ( 1.0 * nodeVar98 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar99, clamp( dot( normalView, nodeVar63 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar99, clamp( dot( normalView, nodeVar96 ), 0.0, 1.0 ) ) ) );
	nodeVar101 = ( nodeVar83 * nodeVar100 );
	nodeVar102 = ( nodeVar101 * multiScatteringCompensation );
	nodeVar103 = ( directSpecular + nodeVar102 );
	directSpecular = nodeVar103;
	nodeVar104 = ( render.nodeUniform32 - v_positionView );
	nodeVar105 = normalize( nodeVar104 );
	nodeVar106 = dot( normalView, nodeVar105 );

	if ( ( render.nodeUniform34 > 0.0 ) ) {

		nodeVar108 = length( nodeVar104 );
		nodeVar109 = ( nodeVar108 / render.nodeUniform34 );
		nodeVar110 = clamp( ( 1.0 - ( ( ( nodeVar109 * nodeVar109 ) * nodeVar109 ) * nodeVar109 ) ), 0.0, 1.0 );
		nodeVar107 = ( ( 1.0 / max( pow( nodeVar108, render.nodeUniform35 ), 0.01 ) ) * ( nodeVar110 * nodeVar110 ) );

	} else {

		nodeVar107 = ( 1.0 / max( pow( length( nodeVar104 ), render.nodeUniform35 ), 0.01 ) );

	}

	nodeVar111 = ( render.nodeUniform33 * vec3<f32>( nodeVar107 ) );
	nodeVar112 = ( vec3<f32>( clamp( nodeVar106, 0.0, 1.0 ) ) * nodeVar111 );
	nodeVar113 = nodeVar112;
	nodeVar114 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar115 = ( nodeVar113 * nodeVar114 );
	nodeVar116 = ( nodeVar105 + positionViewDirection );
	nodeVar117 = normalize( nodeVar116 );
	nodeVar118 = dot( positionViewDirection, nodeVar117 );
	nodeVar119 = clamp( nodeVar118, 0.0, 1.0 );
	nodeVar120 = exp2( ( ( ( nodeVar119 * -5.55473 ) - 6.98316 ) * nodeVar119 ) );
	nodeVar121 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar120 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar120 ) ) );
	nodeVar122 = ( vec3<f32>( 1.0 ) - nodeVar121 );
	nodeVar123 = nodeVar122;
	nodeVar124 = ( nodeVar115 * nodeVar123 );
	nodeVar125 = ( directDiffuse + nodeVar124 );
	directDiffuse = nodeVar125;
	nodeVar126 = normalize( ( nodeVar105 + positionViewDirection ) );
	nodeVar127 = clamp( dot( positionViewDirection, nodeVar126 ), 0.0, 1.0 );
	nodeVar128 = exp2( ( ( ( nodeVar127 * -5.55473 ) - 6.98316 ) * nodeVar127 ) );
	nodeVar129 = ( Roughness * Roughness );
	nodeVar130 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar128 ) ) ) + vec3<f32>( ( 1.0 * nodeVar128 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar129, clamp( dot( normalView, nodeVar105 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar129, clamp( dot( normalView, nodeVar126 ), 0.0, 1.0 ) ) ) );
	nodeVar131 = ( nodeVar113 * nodeVar130 );
	nodeVar132 = ( nodeVar131 * multiScatteringCompensation );
	nodeVar133 = ( directSpecular + nodeVar132 );
	directSpecular = nodeVar133;
	nodeVar134 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar135 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar136 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar137 = ( SpecularF90 * dfg.y );
	nodeVar138 = ( nodeVar136 + vec3<f32>( nodeVar137 ) );
	nodeVar139 = ( nodeVar134 + nodeVar138 );
	nodeVar134 = nodeVar139;
	nodeVar140 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar141 = nodeVar140;
	nodeVar142 = ( nodeVar141 * vec3<f32>( 0.047619 ) );
	nodeVar143 = ( SpecularColor + nodeVar142 );
	nodeVar144 = ( nodeVar138 * nodeVar143 );
	nodeVar145 = ( dfg.x + dfg.y );
	nodeVar146 = ( 1.0 - nodeVar145 );
	nodeVar147 = nodeVar146;
	nodeVar148 = ( vec3<f32>( nodeVar147 ) * nodeVar143 );
	nodeVar149 = ( vec3<f32>( 1.0 ) - nodeVar148 );
	nodeVar150 = nodeVar149;
	nodeVar151 = ( nodeVar144 / nodeVar150 );
	nodeVar152 = ( nodeVar151 * vec3<f32>( nodeVar147 ) );
	nodeVar153 = ( nodeVar135 + nodeVar152 );
	nodeVar135 = nodeVar153;
	nodeVar154 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar155 = ( irradiance * nodeVar154 );
	nodeVar156 = ( nodeVar134 + nodeVar135 );
	nodeVar157 = ( vec3<f32>( 1.0 ) - nodeVar156 );
	nodeVar158 = nodeVar157;
	nodeVar159 = ( nodeVar155 * nodeVar158 );
	nodeVar160 = nodeVar159;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar161 = ( indirectDiffuse + nodeVar160 );
	indirectDiffuse = nodeVar161;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar162 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar163 = ( SpecularF90 * dfg.y );
	nodeVar164 = ( nodeVar162 + vec3<f32>( nodeVar163 ) );
	nodeVar165 = ( singleScatteringDielectric + nodeVar164 );
	singleScatteringDielectric = nodeVar165;
	nodeVar166 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar167 = nodeVar166;
	nodeVar168 = ( nodeVar167 * vec3<f32>( 0.047619 ) );
	nodeVar169 = ( SpecularColor + nodeVar168 );
	nodeVar170 = ( nodeVar164 * nodeVar169 );
	nodeVar171 = ( dfg.x + dfg.y );
	nodeVar172 = ( 1.0 - nodeVar171 );
	nodeVar173 = nodeVar172;
	nodeVar174 = ( vec3<f32>( nodeVar173 ) * nodeVar169 );
	nodeVar175 = ( vec3<f32>( 1.0 ) - nodeVar174 );
	nodeVar176 = nodeVar175;
	nodeVar177 = ( nodeVar170 / nodeVar176 );
	nodeVar178 = ( nodeVar177 * vec3<f32>( nodeVar173 ) );
	nodeVar179 = ( multiScatteringDielectric + nodeVar178 );
	multiScatteringDielectric = nodeVar179;
	nodeVar180 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar181 = ( SpecularF90 * dfg.y );
	nodeVar182 = ( nodeVar180 + vec3<f32>( nodeVar181 ) );
	nodeVar183 = ( singleScatteringMetallic + nodeVar182 );
	singleScatteringMetallic = nodeVar183;
	nodeVar184 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar185 = nodeVar184;
	nodeVar186 = ( nodeVar185 * vec3<f32>( 0.047619 ) );
	nodeVar187 = ( DiffuseColor.xyz + nodeVar186 );
	nodeVar188 = ( nodeVar182 * nodeVar187 );
	nodeVar189 = ( dfg.x + dfg.y );
	nodeVar190 = ( 1.0 - nodeVar189 );
	nodeVar191 = nodeVar190;
	nodeVar192 = ( vec3<f32>( nodeVar191 ) * nodeVar187 );
	nodeVar193 = ( vec3<f32>( 1.0 ) - nodeVar192 );
	nodeVar194 = nodeVar193;
	nodeVar195 = ( nodeVar188 / nodeVar194 );
	nodeVar196 = ( nodeVar195 * vec3<f32>( nodeVar191 ) );
	nodeVar197 = ( multiScatteringMetallic + nodeVar196 );
	multiScatteringMetallic = nodeVar197;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar198 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar199 = ( radiance * nodeVar198 );
	nodeVar200 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar201 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar202 = ( nodeVar200 * nodeVar201 );
	nodeVar203 = ( nodeVar199 + nodeVar202 );
	nodeVar204 = nodeVar203;
	nodeVar205 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar206 = ( vec3<f32>( 1.0 ) - nodeVar205 );
	nodeVar207 = nodeVar206;
	nodeVar208 = ( DiffuseContribution * nodeVar207 );
	nodeVar209 = ( nodeVar208 * nodeVar201 );
	nodeVar210 = nodeVar209;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar211 = ( indirectSpecular + nodeVar204 );
	indirectSpecular = nodeVar211;
	nodeVar212 = ( indirectDiffuse + nodeVar210 );
	indirectDiffuse = nodeVar212;
	ambientOcclusion = 1.0;
	nodeVar213 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar213;
	nodeVar214 = dot( normalView, positionViewDirection );
	nodeVar215 = ( clamp( nodeVar214, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar216 = ( Roughness * -16.0 );
	nodeVar217 = ( 1.0 - nodeVar216 );
	nodeVar218 = nodeVar217;
	nodeVar219 = ( - nodeVar218 );
	nodeVar220 = exp2( nodeVar219 );
	nodeVar221 = pow( nodeVar215, nodeVar220 );
	nodeVar222 = ( 1.0 - nodeVar221 );
	nodeVar223 = nodeVar222;
	nodeVar224 = ( ambientOcclusion - nodeVar223 );
	nodeVar225 = ( indirectSpecular * vec3<f32>( clamp( nodeVar224, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar225;
	nodeVar226 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar226;
	nodeVar227 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar227;
	nodeVar228 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar228;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar229 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar230 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform36, object.nodeUniform37, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform38 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform39 * object.nodeUniform39 ) * nodeVar229 ) * nodeVar229 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar230;

	// result

	output.color = nodeVar230;

	return output;

}
