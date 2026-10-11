// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform3_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform3 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform5_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform5 : texture_3d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform20_sampler : sampler;
@binding( 6 ) @group( 1 ) var nodeUniform20 : texture_2d<f32>;
@binding( 7 ) @group( 1 ) var nodeUniform33_sampler : sampler_comparison;
@binding( 8 ) @group( 1 ) var nodeUniform33 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : mat4x4<f32>,
	nodeUniform2 : mat4x4<f32>,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform6 : f32,
	nodeUniform7 : mat4x4<f32>,
	nodeUniform8 : f32,
	nodeUniform9 : f32,
	nodeUniform10 : f32,
	nodeUniform12 : mat3x3<f32>,
	nodeUniform13 : f32,
	nodeUniform14 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform18 : vec3<f32>,
	nodeUniform19 : f32,
	nodeUniform41 : vec3<f32>,
	nodeUniform42 : vec3<f32>,
	nodeUniform43 : vec3<f32>,
	nodeUniform44 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform22 : vec3<f32>,
	nodeUniform23 : vec3<f32>,
	nodeUniform21 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform38 : vec3<f32>,
	nodeUniform39 : f32,
	nodeUniform40 : f32,
	nodeUniform24 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform37 : vec3<f32>,
	nodeUniform30 : mat4x4<f32>,
	nodeUniform31 : f32,
	nodeUniform32 : f32,
	nodeUniform36 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform34 : f32,
	nodeUniform35 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar1 : vec4<f32>;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : f32;
var<private> nodeVar9 : vec3<f32>;
var<private> nodeVar10 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar11 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar12 : f32;
var<private> nodeVar13 : f32;
var<private> NORMAL_normalView : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar14 : vec3<f32>;
var<private> nodeVar15 : vec3<f32>;
var<private> nodeVar16 : f32;
var<private> nodeVar17 : f32;
var<private> nodeVar18 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar19 : f32;
var<private> nodeVar20 : vec2<f32>;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : f32;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : vec3<f32>;
var<private> nodeVar26 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : vec3<f32>;
var<private> nodeVar31 : vec3<f32>;
var<private> nodeVar32 : vec3<f32>;
var<private> nodeVar33 : vec4<f32>;
var<private> nodeVar34 : vec4<f32>;
var<private> nodeVar35 : vec3<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> nodeVar37 : f32;
var<private> nodeVar38 : vec3<f32>;
var<private> nodeVar39 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar40 : vec3<f32>;
var<private> nodeVar41 : vec3<f32>;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : vec3<f32>;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : f32;
var<private> nodeVar54 : f32;
var<private> nodeVar55 : f32;
var<private> nodeVar56 : vec3<f32>;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec4<f32>;
var<private> nodeVar62 : vec4<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> nodeVar65 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : vec4<f32>;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : f32;
var<private> nodeVar71 : f32;
var<private> nodeVar72 : vec2<f32>;
var<private> nodeVar73 : f32;
var<private> nodeVar74 : vec2<f32>;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : vec2<f32>;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : vec2<f32>;
var<private> nodeVar79 : f32;
var<private> nodeVar80 : vec2<f32>;
var<private> nodeVar81 : f32;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : vec3<f32>;
var<private> nodeVar84 : vec3<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : vec3<f32>;
var<private> nodeVar88 : vec3<f32>;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : f32;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : vec3<f32>;
var<private> nodeVar93 : vec3<f32>;
var<private> nodeVar94 : vec3<f32>;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : f32;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : f32;
var<private> nodeVar101 : vec3<f32>;
var<private> nodeVar102 : vec3<f32>;
var<private> nodeVar103 : vec3<f32>;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : f32;
var<private> nodeVar108 : f32;
var<private> nodeVar109 : f32;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : vec3<f32>;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : vec3<f32>;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : f32;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : vec3<f32>;
var<private> nodeVar132 : vec3<f32>;
var<private> nodeVar133 : vec3<f32>;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : f32;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : vec3<f32>;
var<private> nodeVar142 : vec3<f32>;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : f32;
var<private> nodeVar147 : f32;
var<private> nodeVar148 : f32;
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
var<private> nodeVar161 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : f32;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : f32;
var<private> nodeVar173 : f32;
var<private> nodeVar174 : f32;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : f32;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : vec3<f32>;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : f32;
var<private> nodeVar191 : f32;
var<private> nodeVar192 : f32;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : vec3<f32>;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : vec3<f32>;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar214 : vec3<f32>;
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
var<private> nodeVar225 : f32;
var<private> nodeVar226 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : f32;
var<private> nodeVar231 : vec4<f32>;

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
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec2<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar1 = textureSample( nodeUniform3, nodeUniform3_sampler, ( object.nodeUniform4 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar2 = dot( ( nodeVar1.xyz * vec3<f32>( 1.0, 1.0, 1.0 ) ), vec3<f32>( 0.2126, 0.7152, 0.0722 ) );
	nodeVar3 = textureSample( nodeUniform5, nodeUniform5_sampler, ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 22.0 ) ), 0.37 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar4 = mix( -0.11, 1.01, object.nodeUniform6 );
	nodeVar5 = textureSample( nodeUniform5, nodeUniform5_sampler, ( ( v_positionWorld * vec3<f32>( 4.2 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar6 = clamp( ( ( nodeVar5 * 0.9 ) + 0.5 ), 0.0, 1.0 );
	nodeVar7 = ( 1.0 - smoothstep( nodeVar4, ( nodeVar4 + 0.1 ), nodeVar6 ) );
	nodeVar8 = ( nodeVar7 * nodeVar7 );
	nodeVar9 = mix( ( mix( ( ( vec3<f32>( 0.10224173307914941, 0.11193242782769693, 0.09758734713304495 ) * vec3<f32>( ( ( nodeVar2 * 1.6 ) + 0.45 ) ) ) * vec3<f32>( 3.4 ) ), ( ( vec3<f32>( 0.028426039499072558, 0.04231141061442144, 0.04518620437910499 ) * vec3<f32>( ( nodeVar2 + 0.4 ) ) ) * vec3<f32>( 3.4 ) ), ( smoothstep( -0.35, 0.6, nodeVar3 ) * 0.5 ) ) * vec3<f32>( ( 1.0 - ( clamp( ( ( 0.0 + ( 1.0 - smoothstep( 0.014000000000000002, 0.04000000000000001, length( ( nodeVarying7 - vec2<f32>( 0.139, 0.252 ) ) ) ) ) ) + ( 1.0 - smoothstep( 0.014000000000000002, 0.04000000000000001, length( ( nodeVarying7 - vec2<f32>( 0.231, 0.252 ) ) ) ) ) ), 0.0, 1.0 ) * 0.7 ) ) ) ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar8 * 0.9 ) );
	DiffuseColor = vec4<f32>( nodeVar9, 1.0 );

	if ( ( nodeVar6 > nodeVar4 ) ) {

		nodeVar10 = 1.0;

	} else {

		nodeVar10 = 0.0;

	}

	DiffuseColor.w = ( DiffuseColor.w * nodeVar10 );

	if ( ( DiffuseColor.w <= object.nodeUniform8 ) ) {

		discard;
		

	}

	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform9;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar11 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( object.nodeUniform10, 0.0525 ) + max( max( nodeVar11.x, nodeVar11.y ), nodeVar11.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform9 ) ) );
	nodeVar12 = textureSample( nodeUniform5, nodeUniform5_sampler, ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 30.0 ) ), 0.37 ) / vec3<f32>( 8.0 ) ) ).x;

	if ( ( object.nodeUniform6 > 0.0 ) ) {

		nodeVar13 = 3.2;

	} else {

		nodeVar13 = 0.0;

	}

	NORMAL_normalView = normalViewGeometry;
	normalView = NORMAL_normalView;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar14 = normalize( normalWorld );
	nodeVar15 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar16 = pow( ( 1.0 - clamp( dot( nodeVar14, nodeVar15 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar17 = smoothstep( -0.35, 0.55, dot( nodeVar14, object.nodeUniform17 ) );
	nodeVar18 = smoothstep( -0.15, 0.85, ( - dot( nodeVar15, object.nodeUniform17 ) ) );
	EmissiveColor = ( ( ( ( ( ( mix( vec3<f32>( 0.34670405634441115, 0.6866853124288864, 1.0 ), vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ), object.nodeUniform13 ) * vec3<f32>( clamp( ( ( 0.0 + ( 1.0 - smoothstep( 0.0043749999999999995, 0.0125, length( ( nodeVarying7 - vec2<f32>( 0.139, 0.252 ) ) ) ) ) ) + ( 1.0 - smoothstep( 0.0043749999999999995, 0.0125, length( ( nodeVarying7 - vec2<f32>( 0.231, 0.252 ) ) ) ) ) ), 0.0, 1.0 ) ) ) * vec3<f32>( 1.0 ) ) * vec3<f32>( 1.36 ) ) + ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform13 ) ) * vec3<f32>( ( 1.0 - smoothstep( 0.0, 0.035, abs( nodeVar12 ) ) ) ) ) * vec3<f32>( 0.6 ) ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar7 ) ) ) * vec3<f32>( nodeVar13 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform14 * vec3<f32>( nodeVar16 ) ) * vec3<f32>( nodeVar17 ) ) * vec3<f32>( ( ( nodeVar18 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform18 * vec3<f32>( nodeVar16 ) ) * vec3<f32>( ( 1.0 - ( nodeVar17 * nodeVar18 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar9 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar9, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform19 ) * vec3<f32>( ( 1.0 - nodeVar8 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar19 = dot( normalView, positionViewDirection );
	nodeVar20 = textureSample( nodeUniform20, nodeUniform20_sampler, vec2<f32>( Roughness, clamp( nodeVar19, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar20;
	nodeVar21 = ( dfg.x + dfg.y );
	nodeVar22 = ( 1.0 / nodeVar21 );
	nodeVar23 = nodeVar22;
	nodeVar24 = ( nodeVar23 - 1.0 );
	nodeVar25 = ( SpecularColorBlended * vec3<f32>( nodeVar24 ) );
	nodeVar26 = ( nodeVar25 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar26;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar27 = dot( normalWorld, normalize( render.nodeUniform23 ) );
	nodeVar28 = ( nodeVar27 * 0.5 );
	nodeVar29 = ( nodeVar28 + 0.5 );
	nodeVar30 = mix( render.nodeUniform21, render.nodeUniform22, nodeVar29 );
	nodeVar31 = ( irradiance + nodeVar30 );
	irradiance = nodeVar31;
	nodeVar32 = ( render.nodeUniform24 - render.nodeUniform25 );
	nodeVar33 = vec4<f32>( nodeVar32, 0.0 );
	nodeVar34 = ( render.cameraViewMatrix * nodeVar33 );
	nodeVar35 = normalize( nodeVar34.xyz );
	nodeVar36 = nodeVar35;
	nodeVar37 = dot( normalView, nodeVar36 );
	nodeVar38 = ( vec3<f32>( clamp( nodeVar37, 0.0, 1.0 ) ) * render.nodeUniform26 );
	nodeVar39 = nodeVar38;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar40 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar41 = ( nodeVar39 * nodeVar40 );
	nodeVar42 = ( nodeVar36 + positionViewDirection );
	nodeVar43 = normalize( nodeVar42 );
	nodeVar44 = dot( positionViewDirection, nodeVar43 );
	nodeVar45 = clamp( nodeVar44, 0.0, 1.0 );
	nodeVar46 = exp2( ( ( ( nodeVar45 * -5.55473 ) - 6.98316 ) * nodeVar45 ) );
	nodeVar47 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar46 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar46 ) ) );
	nodeVar48 = ( vec3<f32>( 1.0 ) - nodeVar47 );
	nodeVar49 = nodeVar48;
	nodeVar50 = ( nodeVar41 * nodeVar49 );
	nodeVar51 = ( directDiffuse + nodeVar50 );
	directDiffuse = nodeVar51;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar52 = normalize( ( nodeVar36 + positionViewDirection ) );
	nodeVar53 = clamp( dot( positionViewDirection, nodeVar52 ), 0.0, 1.0 );
	nodeVar54 = exp2( ( ( ( nodeVar53 * -5.55473 ) - 6.98316 ) * nodeVar53 ) );
	nodeVar55 = ( Roughness * Roughness );
	nodeVar56 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar54 ) ) ) + vec3<f32>( ( 1.0 * nodeVar54 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar55, clamp( dot( normalView, nodeVar36 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar55, clamp( dot( normalView, nodeVar52 ), 0.0, 1.0 ) ) ) );
	nodeVar57 = ( nodeVar39 * nodeVar56 );
	nodeVar58 = ( nodeVar57 * multiScatteringCompensation );
	nodeVar59 = ( directSpecular + nodeVar58 );
	directSpecular = nodeVar59;
	nodeVar60 = ( render.nodeUniform27 - render.nodeUniform28 );
	nodeVar61 = vec4<f32>( nodeVar60, 0.0 );
	nodeVar62 = ( render.cameraViewMatrix * nodeVar61 );
	nodeVar63 = normalize( nodeVar62.xyz );
	nodeVar64 = nodeVar63;
	nodeVar65 = dot( normalView, nodeVar64 );
	shadowPositionWorld = v_positionWorld;
	nodeVar67 = ( render.nodeUniform30 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform31 ) ) ), 1.0 ) );
	nodeVar68 = ( nodeVar67.xyz / vec3<f32>( nodeVar67.w ) );
	nodeVar69 = vec3<f32>( nodeVar68.x, ( 1.0 - nodeVar68.y ), ( nodeVar68.z + render.nodeUniform32 ) );

	if ( ( ( ( ( ( nodeVar69.x >= 0.0 ) && ( nodeVar69.x <= 1.0 ) ) && ( nodeVar69.y >= 0.0 ) ) && ( nodeVar69.y <= 1.0 ) ) && ( nodeVar69.z <= 1.0 ) ) ) {

		nodeVar70 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar71 = ( render.nodeUniform34 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform35 ).x );
		nodeVar72 = ( nodeVar69.xy + ( vogelDiskSample( 0, 5, nodeVar70 ) * vec2<f32>( nodeVar71 ) ) );
		nodeVar73 = textureSampleCompare( nodeUniform33, nodeUniform33_sampler, nodeVar72, nodeVar69.z );
		nodeVar74 = ( nodeVar69.xy + ( vogelDiskSample( 1, 5, nodeVar70 ) * vec2<f32>( nodeVar71 ) ) );
		nodeVar75 = textureSampleCompare( nodeUniform33, nodeUniform33_sampler, nodeVar74, nodeVar69.z );
		nodeVar76 = ( nodeVar69.xy + ( vogelDiskSample( 2, 5, nodeVar70 ) * vec2<f32>( nodeVar71 ) ) );
		nodeVar77 = textureSampleCompare( nodeUniform33, nodeUniform33_sampler, nodeVar76, nodeVar69.z );
		nodeVar78 = ( nodeVar69.xy + ( vogelDiskSample( 3, 5, nodeVar70 ) * vec2<f32>( nodeVar71 ) ) );
		nodeVar79 = textureSampleCompare( nodeUniform33, nodeUniform33_sampler, nodeVar78, nodeVar69.z );
		nodeVar80 = ( nodeVar69.xy + ( vogelDiskSample( 4, 5, nodeVar70 ) * vec2<f32>( nodeVar71 ) ) );
		nodeVar81 = textureSampleCompare( nodeUniform33, nodeUniform33_sampler, nodeVar80, nodeVar69.z );
		nodeVar66 = ( ( ( ( ( nodeVar73 + nodeVar75 ) + nodeVar77 ) + nodeVar79 ) + nodeVar81 ) * 0.2 );

	} else {

		nodeVar66 = 1.0;

	}

	nodeVar82 = mix( 1.0, nodeVar66, render.nodeUniform36 );
	nodeVar83 = ( vec3<f32>( clamp( nodeVar65, 0.0, 1.0 ) ) * ( render.nodeUniform29 * vec3<f32>( nodeVar82 ) ) );
	nodeVar84 = nodeVar83;
	nodeVar85 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar86 = ( nodeVar84 * nodeVar85 );
	nodeVar87 = ( nodeVar64 + positionViewDirection );
	nodeVar88 = normalize( nodeVar87 );
	nodeVar89 = dot( positionViewDirection, nodeVar88 );
	nodeVar90 = clamp( nodeVar89, 0.0, 1.0 );
	nodeVar91 = exp2( ( ( ( nodeVar90 * -5.55473 ) - 6.98316 ) * nodeVar90 ) );
	nodeVar92 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar91 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar91 ) ) );
	nodeVar93 = ( vec3<f32>( 1.0 ) - nodeVar92 );
	nodeVar94 = nodeVar93;
	nodeVar95 = ( nodeVar86 * nodeVar94 );
	nodeVar96 = ( directDiffuse + nodeVar95 );
	directDiffuse = nodeVar96;
	nodeVar97 = normalize( ( nodeVar64 + positionViewDirection ) );
	nodeVar98 = clamp( dot( positionViewDirection, nodeVar97 ), 0.0, 1.0 );
	nodeVar99 = exp2( ( ( ( nodeVar98 * -5.55473 ) - 6.98316 ) * nodeVar98 ) );
	nodeVar100 = ( Roughness * Roughness );
	nodeVar101 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar99 ) ) ) + vec3<f32>( ( 1.0 * nodeVar99 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar100, clamp( dot( normalView, nodeVar64 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar100, clamp( dot( normalView, nodeVar97 ), 0.0, 1.0 ) ) ) );
	nodeVar102 = ( nodeVar84 * nodeVar101 );
	nodeVar103 = ( nodeVar102 * multiScatteringCompensation );
	nodeVar104 = ( directSpecular + nodeVar103 );
	directSpecular = nodeVar104;
	nodeVar105 = ( render.nodeUniform37 - v_positionView );
	nodeVar106 = normalize( nodeVar105 );
	nodeVar107 = dot( normalView, nodeVar106 );

	if ( ( render.nodeUniform39 > 0.0 ) ) {

		nodeVar109 = length( nodeVar105 );
		nodeVar110 = ( nodeVar109 / render.nodeUniform39 );
		nodeVar111 = clamp( ( 1.0 - ( ( ( nodeVar110 * nodeVar110 ) * nodeVar110 ) * nodeVar110 ) ), 0.0, 1.0 );
		nodeVar108 = ( ( 1.0 / max( pow( nodeVar109, render.nodeUniform40 ), 0.01 ) ) * ( nodeVar111 * nodeVar111 ) );

	} else {

		nodeVar108 = ( 1.0 / max( pow( length( nodeVar105 ), render.nodeUniform40 ), 0.01 ) );

	}

	nodeVar112 = ( render.nodeUniform38 * vec3<f32>( nodeVar108 ) );
	nodeVar113 = ( vec3<f32>( clamp( nodeVar107, 0.0, 1.0 ) ) * nodeVar112 );
	nodeVar114 = nodeVar113;
	nodeVar115 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar116 = ( nodeVar114 * nodeVar115 );
	nodeVar117 = ( nodeVar106 + positionViewDirection );
	nodeVar118 = normalize( nodeVar117 );
	nodeVar119 = dot( positionViewDirection, nodeVar118 );
	nodeVar120 = clamp( nodeVar119, 0.0, 1.0 );
	nodeVar121 = exp2( ( ( ( nodeVar120 * -5.55473 ) - 6.98316 ) * nodeVar120 ) );
	nodeVar122 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar121 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar121 ) ) );
	nodeVar123 = ( vec3<f32>( 1.0 ) - nodeVar122 );
	nodeVar124 = nodeVar123;
	nodeVar125 = ( nodeVar116 * nodeVar124 );
	nodeVar126 = ( directDiffuse + nodeVar125 );
	directDiffuse = nodeVar126;
	nodeVar127 = normalize( ( nodeVar106 + positionViewDirection ) );
	nodeVar128 = clamp( dot( positionViewDirection, nodeVar127 ), 0.0, 1.0 );
	nodeVar129 = exp2( ( ( ( nodeVar128 * -5.55473 ) - 6.98316 ) * nodeVar128 ) );
	nodeVar130 = ( Roughness * Roughness );
	nodeVar131 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar129 ) ) ) + vec3<f32>( ( 1.0 * nodeVar129 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar130, clamp( dot( normalView, nodeVar106 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar130, clamp( dot( normalView, nodeVar127 ), 0.0, 1.0 ) ) ) );
	nodeVar132 = ( nodeVar114 * nodeVar131 );
	nodeVar133 = ( nodeVar132 * multiScatteringCompensation );
	nodeVar134 = ( directSpecular + nodeVar133 );
	directSpecular = nodeVar134;
	nodeVar135 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar136 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar137 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar138 = ( SpecularF90 * dfg.y );
	nodeVar139 = ( nodeVar137 + vec3<f32>( nodeVar138 ) );
	nodeVar140 = ( nodeVar135 + nodeVar139 );
	nodeVar135 = nodeVar140;
	nodeVar141 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar142 = nodeVar141;
	nodeVar143 = ( nodeVar142 * vec3<f32>( 0.047619 ) );
	nodeVar144 = ( SpecularColor + nodeVar143 );
	nodeVar145 = ( nodeVar139 * nodeVar144 );
	nodeVar146 = ( dfg.x + dfg.y );
	nodeVar147 = ( 1.0 - nodeVar146 );
	nodeVar148 = nodeVar147;
	nodeVar149 = ( vec3<f32>( nodeVar148 ) * nodeVar144 );
	nodeVar150 = ( vec3<f32>( 1.0 ) - nodeVar149 );
	nodeVar151 = nodeVar150;
	nodeVar152 = ( nodeVar145 / nodeVar151 );
	nodeVar153 = ( nodeVar152 * vec3<f32>( nodeVar148 ) );
	nodeVar154 = ( nodeVar136 + nodeVar153 );
	nodeVar136 = nodeVar154;
	nodeVar155 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar156 = ( irradiance * nodeVar155 );
	nodeVar157 = ( nodeVar135 + nodeVar136 );
	nodeVar158 = ( vec3<f32>( 1.0 ) - nodeVar157 );
	nodeVar159 = nodeVar158;
	nodeVar160 = ( nodeVar156 * nodeVar159 );
	nodeVar161 = nodeVar160;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar162 = ( indirectDiffuse + nodeVar161 );
	indirectDiffuse = nodeVar162;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar163 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar164 = ( SpecularF90 * dfg.y );
	nodeVar165 = ( nodeVar163 + vec3<f32>( nodeVar164 ) );
	nodeVar166 = ( singleScatteringDielectric + nodeVar165 );
	singleScatteringDielectric = nodeVar166;
	nodeVar167 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar168 = nodeVar167;
	nodeVar169 = ( nodeVar168 * vec3<f32>( 0.047619 ) );
	nodeVar170 = ( SpecularColor + nodeVar169 );
	nodeVar171 = ( nodeVar165 * nodeVar170 );
	nodeVar172 = ( dfg.x + dfg.y );
	nodeVar173 = ( 1.0 - nodeVar172 );
	nodeVar174 = nodeVar173;
	nodeVar175 = ( vec3<f32>( nodeVar174 ) * nodeVar170 );
	nodeVar176 = ( vec3<f32>( 1.0 ) - nodeVar175 );
	nodeVar177 = nodeVar176;
	nodeVar178 = ( nodeVar171 / nodeVar177 );
	nodeVar179 = ( nodeVar178 * vec3<f32>( nodeVar174 ) );
	nodeVar180 = ( multiScatteringDielectric + nodeVar179 );
	multiScatteringDielectric = nodeVar180;
	nodeVar181 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar182 = ( SpecularF90 * dfg.y );
	nodeVar183 = ( nodeVar181 + vec3<f32>( nodeVar182 ) );
	nodeVar184 = ( singleScatteringMetallic + nodeVar183 );
	singleScatteringMetallic = nodeVar184;
	nodeVar185 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar186 = nodeVar185;
	nodeVar187 = ( nodeVar186 * vec3<f32>( 0.047619 ) );
	nodeVar188 = ( DiffuseColor.xyz + nodeVar187 );
	nodeVar189 = ( nodeVar183 * nodeVar188 );
	nodeVar190 = ( dfg.x + dfg.y );
	nodeVar191 = ( 1.0 - nodeVar190 );
	nodeVar192 = nodeVar191;
	nodeVar193 = ( vec3<f32>( nodeVar192 ) * nodeVar188 );
	nodeVar194 = ( vec3<f32>( 1.0 ) - nodeVar193 );
	nodeVar195 = nodeVar194;
	nodeVar196 = ( nodeVar189 / nodeVar195 );
	nodeVar197 = ( nodeVar196 * vec3<f32>( nodeVar192 ) );
	nodeVar198 = ( multiScatteringMetallic + nodeVar197 );
	multiScatteringMetallic = nodeVar198;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar199 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar200 = ( radiance * nodeVar199 );
	nodeVar201 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar202 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar203 = ( nodeVar201 * nodeVar202 );
	nodeVar204 = ( nodeVar200 + nodeVar203 );
	nodeVar205 = nodeVar204;
	nodeVar206 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar207 = ( vec3<f32>( 1.0 ) - nodeVar206 );
	nodeVar208 = nodeVar207;
	nodeVar209 = ( DiffuseContribution * nodeVar208 );
	nodeVar210 = ( nodeVar209 * nodeVar202 );
	nodeVar211 = nodeVar210;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar212 = ( indirectSpecular + nodeVar205 );
	indirectSpecular = nodeVar212;
	nodeVar213 = ( indirectDiffuse + nodeVar211 );
	indirectDiffuse = nodeVar213;
	ambientOcclusion = 1.0;
	nodeVar214 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar214;
	nodeVar215 = dot( normalView, positionViewDirection );
	nodeVar216 = ( clamp( nodeVar215, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar217 = ( Roughness * -16.0 );
	nodeVar218 = ( 1.0 - nodeVar217 );
	nodeVar219 = nodeVar218;
	nodeVar220 = ( - nodeVar219 );
	nodeVar221 = exp2( nodeVar220 );
	nodeVar222 = pow( nodeVar216, nodeVar221 );
	nodeVar223 = ( 1.0 - nodeVar222 );
	nodeVar224 = nodeVar223;
	nodeVar225 = ( ambientOcclusion - nodeVar224 );
	nodeVar226 = ( indirectSpecular * vec3<f32>( clamp( nodeVar225, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar226;
	nodeVar227 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar227;
	nodeVar228 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar228;
	nodeVar229 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar229;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar230 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar231 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform41, object.nodeUniform42, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform43 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform44 * object.nodeUniform44 ) * nodeVar230 ) * nodeVar230 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar231;

	// result

	output.color = nodeVar231;

	return output;

}
